# repositories/profile_repo.py - ВРЕМЕННАЯ УПРОЩЕННАЯ ВЕРСИЯ

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List, Dict, Any
from datetime import datetime

from models.user import User


class ProfileRepository:
    """Репозиторий для работы с профилем пользователя"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_public_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Получение публичного профиля пользователя"""
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.is_active == True)
        )
        user = result.scalar_one_or_none()

        if not user:
            return None

        # 🔥 ВРЕМЕННО: без курсов
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "status": user.status,
            "about_me": user.about_me,
            "created_at": user.created_at,
            "token_balance": user.token_balance,
            "equipped_item": None,
            "completed_courses": [],  # Временно пустой список
        }

    async def get_achievement_stats(self, user_id: int) -> Dict[str, Any]:
        """Получение статистики для достижений"""
        # 🔥 ВРЕМЕННО: возвращаем заглушку
        return {
            "tests_passed_75": 0,
            "courses_completed_75": 0,
            "items_purchased": 0,
            "has_custom_avatar": False,
        }

    async def get_user_courses(
        self, user_id: int, page: int = 1, limit: int = 10
    ) -> Dict[str, Any]:
        """Получение курсов пользователя с пагинацией"""
        # 🔥 ВРЕМЕННО: возвращаем пустой результат
        return {
            "courses": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "total_pages": 1,
        }
