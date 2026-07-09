# core/redis.py

import redis.asyncio as redis
from typing import Optional, Any
import json
import logging
from core.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """Клиент для работы с Redis"""

    _instance: Optional["RedisClient"] = None
    _client: Optional[redis.Redis] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def connect(self) -> None:
        """Подключение к Redis"""
        if self._client is not None:
            return

        try:
            self._client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                max_connections=10,
            )
            await self._client.ping()
            logger.info("✅ Redis connected")
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}")
            self._client = None

    async def disconnect(self) -> None:
        """Отключение от Redis"""
        if self._client:
            await self._client.close()
            self._client = None
            logger.info("✅ Redis disconnected")

    @property
    def client(self) -> Optional[redis.Redis]:
        """Получение клиента Redis"""
        return self._client

    async def get(self, key: str) -> Optional[Any]:
        """Получение значения по ключу"""
        if not self._client:
            return None
        try:
            value = await self._client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Установка значения с TTL"""
        if not self._client:
            return False
        try:
            await self._client.setex(key, ttl, json.dumps(value, default=str))
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Удаление ключа"""
        if not self._client:
            return False
        try:
            await self._client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """Удаление всех ключей по паттерну"""
        if not self._client:
            return 0
        try:
            keys = await self._client.keys(pattern)
            if keys:
                return await self._client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis delete_pattern error: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """Проверка существования ключа"""
        if not self._client:
            return False
        try:
            return await self._client.exists(key) > 0
        except Exception as e:
            logger.error(f"Redis exists error: {e}")
            return False


# Глобальный экземпляр
redis_client = RedisClient()


# Функция для получения клиента Redis (dependency)
async def get_redis() -> Optional[redis.Redis]:
    """Получение клиента Redis для FastAPI Dependency"""
    return redis_client.client
