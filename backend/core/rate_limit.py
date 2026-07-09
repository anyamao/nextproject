# core/rate_limit.py

from fastapi import Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time
import hashlib
import logging

logger = logging.getLogger(__name__)

# 🔥 Используем in-memory storage (без Redis)
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://",
    default_limits=["100/hour"],
)

logger.info("✅ Rate Limiting (in-memory)")

# Лимиты
REGISTER_LIMIT = "5/minute"
LOGIN_LIMIT = "10/minute"
VERIFY_LIMIT = "3/minute"


class RateLimitChecker:
    """Проверка rate limiting (упрощенная версия)"""

    def __init__(self):
        self._storage = {}

    async def check_ip_rate_limit(
        self, ip: str, limit: int = 10, window: int = 3600
    ) -> bool:
        """Проверка лимита по IP"""
        key = f"ip:{ip}"
        current_time = int(time.time())

        if key not in self._storage:
            self._storage[key] = []

        # Очищаем старые записи
        self._storage[key] = [
            t for t in self._storage[key] if current_time - t < window
        ]

        if len(self._storage[key]) >= limit:
            return False

        self._storage[key].append(current_time)
        return True

    async def check_email_rate_limit(
        self, email: str, limit: int = 3, window: int = 3600
    ) -> bool:
        """Проверка лимита по email"""
        key = f"email:{hashlib.md5(email.lower().encode()).hexdigest()}"
        current_time = int(time.time())

        if key not in self._storage:
            self._storage[key] = []

        self._storage[key] = [
            t for t in self._storage[key] if current_time - t < window
        ]

        if len(self._storage[key]) >= limit:
            return False

        self._storage[key].append(current_time)
        return True


rate_checker = RateLimitChecker()
