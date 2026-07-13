# api/v1/endpoints/courses.py

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from core.database import get_db
from core.auth import get_current_user_optional
from core.rate_limit import limiter
from core.logger import get_logger
from services.course_service import CourseService

logger = get_logger("courses")
router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/subjects")
@limiter.limit("60/minute")
async def get_courses(
    request: Request,
    category: Optional[str] = Query(None, description="Категория курса"),
    search: Optional[str] = Query(None, description="Поиск по названию"),
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(12, ge=1, le=50, description="Количество на странице"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional),  # 🔥 ОПЦИОНАЛЬНО
):
    """
    Получение списка курсов с фильтрацией и пагинацией (ПУБЛИЧНЫЙ)
    """
    user_id = current_user.id if current_user else None

    service = CourseService(db)
    result = await service.get_courses(
        category=category, search=search, user_id=user_id, page=page, limit=limit
    )

    logger.info(f"📚 Courses fetched: {result['total']} total, page {page}")
    return result


@router.get("/{slug}")
@limiter.limit("60/minute")
async def get_course_by_slug(
    request: Request,
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional),  # 🔥 ОПЦИОНАЛЬНО
):
    """
    Получение курса по slug со всеми уроками (ПУБЛИЧНЫЙ)
    """
    user_id = current_user.id if current_user else None

    service = CourseService(db)
    course = await service.get_course_by_slug(slug, user_id)

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    logger.info(f"📖 Course viewed: {slug} by user {user_id or 'anonymous'}")
    return course


# 🔥 ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ


@router.get("/favorites")
async def get_favorites(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),  # 🔥 ОПЦИОНАЛЬНО
):
    """
    Получение избранных курсов пользователя (ТРЕБУЕТ АВТОРИЗАЦИЮ)
    """
    if not current_user:
        return {"favorites": []}

    service = CourseService(db)
    favorites = await service.get_favorites(current_user.id)

    logger.info(f"❤️ Favorites fetched for user {current_user.id}")
    return favorites


@router.post("/{course_id}/favorite")
async def add_favorite(
    request: Request,
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),  # 🔥 ОПЦИОНАЛЬНО
):
    """
    Добавление курса в избранное (ТРЕБУЕТ АВТОРИЗАЦИЮ)
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )

    service = CourseService(db)
    result = await service.toggle_favorite(current_user.id, course_id)

    logger.info(f"❤️ Course {course_id} added to favorites for user {current_user.id}")
    return result


@router.delete("/{course_id}/favorite")
async def remove_favorite(
    request: Request,
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),  # 🔥 ОПЦИОНАЛЬНО
):
    """
    Удаление курса из избранного (ТРЕБУЕТ АВТОРИЗАЦИЮ)
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )

    service = CourseService(db)
    result = await service.toggle_favorite(current_user.id, course_id)

    logger.info(
        f"💔 Course {course_id} removed from favorites for user {current_user.id}"
    )
    return result


@router.post("/{course_id}/enroll")
async def enroll_course(
    request: Request,
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),  # 🔥 ОПЦИОНАЛЬНО
):
    """
    Запись пользователя на курс (ТРЕБУЕТ АВТОРИЗАЦИЮ)
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )

    service = CourseService(db)
    result = await service.enroll_user(current_user.id, course_id)

    logger.info(f"✅ User {current_user.id} enrolled in course {course_id}")
    return result


@router.post("/lessons/{lesson_id}/progress")
async def update_lesson_progress(
    request: Request,
    lesson_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),  # 🔥 ОПЦИОНАЛЬНО
):
    """
    Обновление прогресса по уроку (ТРЕБУЕТ АВТОРИЗАЦИЮ)
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )

    time_spent = data.get("time_spent", 0)
    is_completed = data.get("is_completed", False)

    service = CourseService(db)
    result = await service.update_lesson_progress(
        user_id=current_user.id,
        lesson_id=lesson_id,
        time_spent=time_spent,
        is_completed=is_completed,
    )

    logger.info(f"📊 Lesson {lesson_id} progress updated for user {current_user.id}")
    return result
