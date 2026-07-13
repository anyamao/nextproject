# services/course_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any, List
import logging

from repositories.course_repo import CourseRepository
from core.redis import redis_client
from core.config import settings

logger = logging.getLogger(__name__)


class CourseService:
    """Сервис для работы с курсами"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CourseRepository(db)

    async def get_courses(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
        user_id: Optional[int] = None,
        page: int = 1,
        limit: int = 12,
    ) -> Dict[str, Any]:
        """Получение курсов с пагинацией"""
        offset = (page - 1) * limit

        courses, total = await self.repo.get_courses(
            category=category,
            search=search,
            user_id=user_id,
            limit=limit,
            offset=offset,
        )

        return {
            "courses": courses,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if total > 0 else 1,
        }

    async def get_course_by_slug(
        self, slug: str, user_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Получение курса по slug"""
        # 🔥 Пробуем получить из кеша
        if settings.CACHE_ENABLED and not user_id:
            cache_key = f"course:{slug}"
            cached = await redis_client.get(cache_key)
            if cached:
                logger.debug(f"✅ Cache hit for course {slug}")
                return cached

        # Загружаем из БД
        course = await self.repo.get_by_slug(slug, user_id)

        if course and settings.CACHE_ENABLED and not user_id:
            await redis_client.set(f"course:{slug}", course, settings.CACHE_TTL_PROFILE)

        return course

    async def get_favorites(self, user_id: int) -> List[Dict[str, Any]]:
        """Получение избранных курсов пользователя"""
        return await self.repo.get_favorites(user_id)

    async def toggle_favorite(self, user_id: int, course_id: int) -> Dict[str, Any]:
        """Добавление/удаление из избранного"""
        is_favorite = await self.repo.toggle_favorite(user_id, course_id)

        # Очищаем кеш
        if settings.CACHE_ENABLED:
            await redis_client.delete(f"user:{user_id}:favorites")

        return {"is_favorite": is_favorite}

    async def enroll_user(self, user_id: int, course_id: int) -> Dict[str, Any]:
        """Запись пользователя на курс"""
        result = await self.repo.enroll_user(user_id, course_id)

        # Очищаем кеш
        if settings.CACHE_ENABLED:
            await redis_client.delete(f"user:{user_id}:courses")

        return result

    async def update_lesson_progress(
        self,
        user_id: int,
        lesson_id: int,
        time_spent: int = 0,
        is_completed: bool = False,
    ) -> Dict[str, Any]:
        """Обновление прогресса по уроку"""
        return await self.repo.update_lesson_progress(
            user_id=user_id,
            lesson_id=lesson_id,
            time_spent=time_spent,
            is_completed=is_completed,
        )
