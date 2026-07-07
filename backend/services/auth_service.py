from typing import Optional, Tuple
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
import random
import string

from core.security import create_access_token, create_refresh_token
from repositories.user_repo import UserRepository
from models.user import User
from schemas.auth import UserCreateSchema


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register_user(
        self, user_data: UserCreateSchema, ip_address: str
    ) -> Tuple[User, str, str]:
        """Регистрация нового пользователя с полной валидацией"""

        # 1. Проверка существования email
        existing_email = await self.user_repo.get_by_email(user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует",
            )

        # 2. Проверка существования username
        existing_username = await self.user_repo.get_by_username(user_data.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот username уже занят",
            )

        # 3. Создание пользователя с хешированным паролем
        hashed_password = bcrypt.hashpw(
            user_data.password.encode("utf-8"),
            bcrypt.gensalt(rounds=12),  # 12 раундов - хороший баланс
        ).decode("utf-8")

        new_user = await self.user_repo.create(
            {
                "email": user_data.email,
                "username": user_data.username,
                "hashed_password": hashed_password,
                "is_active": True,
                "is_verified": False,  # Требуется подтверждение email
                "created_at": datetime.utcnow(),
                "registration_ip": ip_address,
                "avatar_url": self._generate_avatar_url(user_data.username),
            }
        )

        # 4. Создание JWT токенов
        access_token = create_access_token(
            data={
                "sub": new_user.email,
                "user_id": new_user.id,
                "username": new_user.username,
            }
        )
        refresh_token = create_refresh_token(
            data={"sub": new_user.email, "user_id": new_user.id}
        )

        # 5. Логирование регистрации
        # await self._log_registration(new_user.id, ip_address)

        return new_user, access_token, refresh_token

    async def verify_email(self, user_id: int, token: str) -> bool:
        """Подтверждение email"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return False

        if user.is_verified:
            raise HTTPException(400, "Email уже подтвержден")

        # Проверка токена верификации
        # ... логика с JWT или случайным кодом

        await self.user_repo.update(user_id, {"is_verified": True})
        return True

    def _generate_avatar_url(self, username: str) -> str:
        """Генерация аватара через UI Avatars API"""
        return f"https://ui-avatars.com/api/?name={username}&background=random&size=128"

    async def _check_breached_password(self, password: str) -> bool:
        """Проверка пароля на утечку (Have I Been Pwned)"""
        # Реализация через API HIBP
        pass
