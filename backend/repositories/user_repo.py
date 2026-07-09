# repositories/user_repo.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional, Dict, Any
from models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_data: Dict[str, Any]) -> User:
        """Создание пользователя"""
        valid_fields = [
            "email",
            "username",
            "hashed_password",
            "is_active",
            "is_verified",
            "avatar_url",
            "status",
            "about_me",
            "first_name",
            "last_name",
            "token_balance",
            "equipped_item_id",
            "registration_ip",
            "last_login",
            "email_verified_at",
            "verification_token",
        ]

        filtered_data = {k: v for k, v in user_data.items() if k in valid_fields}

        user = User(**filtered_data)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_by_email(self, email: str) -> Optional[User]:
        """Получение пользователя по email"""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        """Получение пользователя по username"""
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Получение пользователя по id"""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def update(self, user_id: int, data: Dict[str, Any]) -> Optional[User]:
        """Обновление пользователя"""
        user = await self.get_by_id(user_id)
        if user:
            valid_fields = [
                "email",
                "username",
                "hashed_password",
                "is_active",
                "is_verified",
                "avatar_url",
                "status",
                "about_me",
                "first_name",
                "last_name",
                "token_balance",
                "equipped_item_id",
                "registration_ip",
                "last_login",
                "email_verified_at",
                "verification_token",
            ]
            filtered_data = {k: v for k, v in data.items() if k in valid_fields}

            for key, value in filtered_data.items():
                setattr(user, key, value)
            await self.db.commit()
            await self.db.refresh(user)
        return user

    async def delete(self, user_id: int) -> bool:
        """Удаление пользователя"""
        user = await self.get_by_id(user_id)
        if user:
            await self.db.delete(user)
            await self.db.commit()
            return True
        return False
