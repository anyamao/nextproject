# core/rate_limit.py

import time
import hashlib
from typing import Optional, Tuple
from fastapi import Request, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import redis.asyncio as redis
from core.config import settings
import logging

logger = logging.getLogger(__name__)

# ====== КЛЮЧИ ДЛЯ РАЗНЫХ ТИПОВ ЛИМИТОВ ======


def get_client_ip(request: Request) -> str:
    """Получение реального IP клиента через прокси"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_email_key(request: Request) -> str:
    """Ключ по email для лимита регистраций"""
    # Пытаемся получить email из тела запроса
    try:
        import json

        body = request.state.body if hasattr(request.state, "body") else {}
        if body and "email" in body:
            return f"email:{body['email']}"
    except:
        pass
    return f"email:unknown_{int(time.time() / 3600)}"


def get_combined_key(request: Request) -> str:
    """Комбинированный ключ (IP + email) для максимальной защиты"""
    client_ip = get_client_ip(request)
    email = "unknown"
    try:
        import json

        body = request.state.body if hasattr(request.state, "body") else {}
        if body and "email" in body:
            email = body["email"]
    except:
        pass
    return f"{client_ip}:{email}"


# ====== СОЗДАНИЕ LIMITER ======

# Если Redis включен - используем его, иначе in-memory
if settings.REDIS_ENABLED:
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        limiter = Limiter(
            key_func=get_remote_address,
            storage_uri=settings.REDIS_URL,
            strategy="fixed-window",  # или "moving-window"
            default_limits=["100/hour"],
        )
        logger.info("✅ Rate Limiting с Redis")
    except Exception as e:
        logger.warning(f"⚠️ Redis не доступен, используем in-memory: {e}")
        limiter = Limiter(
            key_func=get_remote_address,
            storage_uri="memory://",
            default_limits=["100/hour"],
        )
else:
    # Для разработки - in-memory
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri="memory://",
        default_limits=["100/hour"],
    )
    logger.info("📦 Rate Limiting in-memory (для разработки)")

# ====== КАСТОМНЫЕ ЛИМИТЫ ======

# Лимиты для разных эндпоинтов
REGISTER_LIMIT = "5/minute"  # 5 регистраций в минуту
REGISTER_IP_LIMIT = "10/hour"  # 10 регистраций с одного IP в час
LOGIN_LIMIT = "10/minute"  # 10 попыток входа в минуту
VERIFY_LIMIT = "3/minute"  # 3 попытки верификации
PASSWORD_RESET_LIMIT = "3/hour"  # 3 запроса сброса пароля в час

# ====== ДОПОЛНИТЕЛЬНЫЕ ПРОВЕРКИ ======


class RateLimitChecker:
    """Класс для дополнительных проверок rate limiting"""

    def __init__(self):
        self.redis = None
        if settings.REDIS_ENABLED:
            try:
                self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            except:
                pass

    async def check_email_rate_limit(
        self, email: str, limit: int = 3, window: int = 3600
    ) -> bool:
        """Проверка лимита по email (защита от множественных регистраций)"""
        if not self.redis:
            return True

        key = f"register_email:{hashlib.md5(email.lower().encode()).hexdigest()}"
        attempts = await self.redis.get(key)

        if attempts and int(attempts) >= limit:
            return False

        await self.redis.incr(key)
        await self.redis.expire(key, window)
        return True

    async def check_ip_rate_limit(
        self, ip: str, limit: int = 10, window: int = 3600
    ) -> bool:
        """Проверка лимита по IP"""
        if not self.redis:
            return True

        key = f"register_ip:{ip}"
        attempts = await self.redis.get(key)

        if attempts and int(attempts) >= limit:
            return False

        await self.redis.incr(key)
        await self.redis.expire(key, window)
        return True


rate_checker = RateLimitChecker()

# ====== MIDDLEWARE ДЛЯ ПЕРЕХВАТА ТЕЛА ЗАПРОСА ======

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import json


class RequestBodyMiddleware(BaseHTTPMiddleware):
    """Middleware для сохранения тела запроса в request.state"""

    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    request.state.body = json.loads(body)
                else:
                    request.state.body = {}
            except:
                request.state.body = {}
        return await call_next(request)
