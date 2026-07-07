# core/database.py

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

from core.config import settings

# 🔥 Создаем engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=40,
    pool_recycle=3600,
)

# 🔥 Фабрика сессий
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# 🔥 Базовый класс для моделей
Base = declarative_base()


# 🔥 Зависимость для получения сессии
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Получение сессии базы данных.
    Используется как зависимость в FastAPI.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
