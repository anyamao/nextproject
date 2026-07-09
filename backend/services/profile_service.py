# services/profile_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any
import logging

from repositories.profile_repo import ProfileRepository

logger = logging.getLogger(__name__)


class ProfileService:
    """Сервис для работы с профилем"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ProfileRepository(db)

    async def get_public_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Получение публичного профиля"""
        logger.info(f"📦 Getting public profile for user {user_id}")
        return await self.repo.get_public_profile(user_id)

    async def get_achievement_stats(self, user_id: int) -> Dict[str, Any]:
        """Получение статистики достижений"""
        return await self.repo.get_achievement_stats(user_id)

    async def get_user_courses(
        self, user_id: int, page: int = 1, limit: int = 10
    ) -> Dict[str, Any]:
        """Получение курсов пользователя с пагинацией"""
        return await self.repo.get_user_courses(user_id, page, limit)

    async def clear_cache(self, user_id: int) -> None:
        """Очистка кеша пользователя (заглушка)"""
        logger.info(f"🗑️ Cache cleared for user {user_id}")
        pass
