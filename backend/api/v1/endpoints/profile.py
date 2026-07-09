# api/v1/endpoints/profile.py

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.auth import get_current_user
from core.rate_limit import limiter
from core.logger import get_logger
from services.profile_service import ProfileService
from models.user import User

logger = get_logger("profile")

# 🔥 ОДИН РОУТЕР
router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/test")
async def test_profile():
    """Тест работы роутера профиля"""
    return {"message": "Profile router works!", "status": "ok"}


@router.get("/public/{user_id}")
@limiter.limit("30/minute")
async def get_public_profile(
    request: Request,
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Получение публичного профиля пользователя"""
    logger.info(f"📖 Getting public profile for user_id={user_id}")

    service = ProfileService(db)
    profile = await service.get_public_profile(user_id)

    if not profile:
        logger.warning(f"❌ User {user_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    logger.info(f"✅ Public profile viewed: user_id={user_id}")
    return profile


@router.get("/public/{user_id}/achievements")
@limiter.limit("30/minute")
async def get_public_achievements(
    request: Request,
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Получение достижений пользователя (публичный эндпоинт)"""
    service = ProfileService(db)
    stats = await service.get_achievement_stats(user_id)
    return stats


@router.get("/public/{user_id}/courses")
@limiter.limit("30/minute")
async def get_public_courses(
    request: Request,
    user_id: int,
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(10, ge=1, le=50, description="Количество на странице"),
    db: AsyncSession = Depends(get_db),
):
    """Получение курсов пользователя с пагинацией"""
    service = ProfileService(db)
    result = await service.get_user_courses(user_id, page, limit)
    return result


@router.get("/achievements")
@limiter.limit("30/minute")
async def get_my_achievements(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получение своих достижений (приватный эндпоинт)"""
    service = ProfileService(db)
    stats = await service.get_achievement_stats(current_user.id)
    return stats


@router.get("/test-stats")
@limiter.limit("30/minute")
async def get_test_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получение статистики тестов (приватный эндпоинт)"""
    return {"tests_passed_75": 0}


@router.post("/cache/clear")
async def clear_profile_cache(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Очистка кеша профиля"""
    service = ProfileService(db)
    await service.clear_cache(current_user.id)
    return {"message": "Cache cleared successfully"}
