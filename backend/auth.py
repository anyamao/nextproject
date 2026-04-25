# backend/auth.py
# ✅ ПОЛНЫЙ ФАЙЛ — все импорты вверху

from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import secrets
from argon2 import PasswordHasher
from dotenv import load_dotenv

load_dotenv()
ph = PasswordHasher()

# 🔁 Импорты из твоих модулей
from database import get_db
from models import User

# === Конфигурация ===

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY not set in environment")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# === Вспомогательные функции ===


# backend/auth.py


# backend/auth.py


def get_password_hash(password: str) -> str:
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except:
        return False


# backend/auth.py


def create_access_token(
    data: dict,  # ✅ Параметр должен называться 'data'
    expires_delta: timedelta = None,
) -> str:
    to_encode = data.copy()  # ✅ Теперь 'data' определён!
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# === Зависимость для получения текущего пользователя ===


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 🔁 Декодируем токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")  # ✅ "sub" = email при создании токена
        if email is None:
            raise credentials_exception
    except JWTError:
        # 🔁 Логируем ошибку для отладки
        import logging

        logging.error(f"JWT decode error: token={token[:20]}...")
        raise credentials_exception

    # 🔁 Ищем пользователя
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user
