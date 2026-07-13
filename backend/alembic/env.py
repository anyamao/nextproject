import asyncio
from logging.config import fileConfig
import sys
from pathlib import Path

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Добавляем путь к проекту
sys.path.insert(0, str(Path(__file__).parent.parent))

# 🔥 ИМПОРТИРУЕМ ТОЛЬКО НОВЫЕ МОДЕЛИ
from core.database import Base

# ЯВНО импортируем все модели, чтобы Alembic их увидел
from models import User, Course, Lesson, UserCourseProgress, LessonProgress

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 🔥 Убеждаемся, что target_metadata содержит только наши таблицы
target_metadata = Base.metadata

# 🔥 ПРОВЕРКА: выводим, какие таблицы видит Alembic
print("=== TABLES FOUND BY ALEMBIC ===")
for table in target_metadata.tables.keys():
    print(f"  - {table}")
print("================================")


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
