# repositories/course_repo.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional, List, Dict, Any
from models.course import (
    Course,
    Lesson,
    UserCourseProgress,
    LessonProgress,
    user_favorites,
)
from models.user import User


class CourseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_courses(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
        user_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[List[Dict[str, Any]], int]:
        """Получение списка курсов с фильтрацией"""
        query = select(Course)

        # 🔥 ЗАГРУЖАЕМ СВЯЗИ ЗАРАНЕЕ
        query = query.options(
            selectinload(Course.enrollments), selectinload(Course.favorites)
        )

        # Фильтры
        filters = []
        if category:
            filters.append(Course.category == category)
        if search:
            filters.append(
                or_(
                    Course.title.ilike(f"%{search}%"),
                    Course.description.ilike(f"%{search}%"),
                )
            )

        if filters:
            query = query.where(and_(*filters))

        # Подсчет общего количества
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total = total.scalar() or 0

        # Пагинация
        query = query.offset(offset).limit(limit)

        # Загрузка данных
        result = await self.db.execute(query)
        courses = result.scalars().all()

        return [
            course.to_dict(user_id=user_id, include_progress=True) for course in courses
        ], total

    async def get_by_slug(
        self, slug: str, user_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Получение курса по slug с загрузкой всех связей"""
        query = select(Course).where(Course.slug == slug)

        # 🔥 ЗАГРУЖАЕМ ВСЕ СВЯЗИ ЗАРАНЕЕ
        query = query.options(
            selectinload(Course.enrollments),
            selectinload(Course.favorites),
            selectinload(Course.lessons).selectinload(Lesson.progress),
        )

        result = await self.db.execute(query)
        course = result.scalar_one_or_none()

        if not course:
            return None

        data = course.to_dict(user_id=user_id, include_progress=True)

        # Добавляем уроки
        data["lessons"] = [
            {
                "id": lesson.id,
                "title": lesson.title,
                "slug": lesson.slug,
                "description": lesson.description,
                "order_index": lesson.order_index,
                "duration_minutes": lesson.duration_minutes,
                "is_free": lesson.is_free,
                "video_url": lesson.video_url,
                "is_completed": any(
                    p.lesson_id == lesson.id and p.user_id == user_id and p.is_completed
                    for p in lesson.progress
                )
                if user_id
                else False,
            }
            for lesson in sorted(course.lessons, key=lambda l: l.order_index)
        ]

        # Прогресс пользователя
        if user_id:
            progress = next(
                (e for e in course.enrollments if e.user_id == user_id), None
            )
            if progress:
                data["user_progress"] = {
                    "completion_percent": progress.completion_percent,
                    "is_completed": progress.is_completed,
                    "last_accessed": progress.last_accessed_at.isoformat()
                    if progress.last_accessed_at
                    else None,
                    "started_at": progress.started_at.isoformat()
                    if progress.started_at
                    else None,
                }
            else:
                data["user_progress"] = None

        return data

    async def get_favorites(self, user_id: int) -> List[Dict[str, Any]]:
        """Получение избранных курсов пользователя"""
        query = select(Course).join(Course.favorites).where(User.id == user_id)
        query = query.options(
            selectinload(Course.enrollments), selectinload(Course.favorites)
        )
        result = await self.db.execute(query)
        courses = result.scalars().all()
        return [course.to_dict() for course in courses]

    # ... остальные методы без изменений ...
