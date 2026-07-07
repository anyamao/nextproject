# core/auth.py

import jwt
from typing import Optional
from datetime import datetime, timedelta

from core.config import settings


def decode_token(token: str) -> Optional[dict]:
    """Декодирование JWT токена"""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError:
        return None


def create_access_token(data: dict) -> str:
    """Создание JWT токена"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Создание Refresh токена"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def is_token_valid(token: str) -> bool:
    """Проверка валидности токена"""
    payload = decode_token(token)
    if not payload:
        return False

    exp = payload.get("exp")
    if not exp:
        return False

    return datetime.utcnow() < datetime.fromtimestamp(exp)
