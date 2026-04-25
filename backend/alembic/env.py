from logging.config import fileConfig
import os
import sys
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from dotenv import load_dotenv
from alembic import context

load_dotenv()
# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
from models import (
    User,
    Article,
    Course,
    Lesson,
    Test,
    Question,
    TestResult,
    Base,
    LessonView,
)  # ✅ Все модели

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# backend/alembic/env.py — в run_migrations_online()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    from sqlalchemy import engine_from_config, pool
    import os
    from dotenv import load_dotenv

    load_dotenv()

    # 🔁 Alembic всегда использует СИНХРОННЫЙ движок
    DATABASE_URL = os.getenv("DATABASE_URL")

    if not DATABASE_URL or DATABASE_URL.startswith("sqlite"):
        # Конвертируем async URL в sync для SQLite
        if DATABASE_URL and DATABASE_URL.startswith("sqlite+aiosqlite"):
            sync_url = DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")
        else:
            sync_url = "sqlite:///./dementia.db"
        print(f"⚙️  Alembic using sync SQLite: {sync_url}")
    else:
        # Для PostgreSQL: убираем +asyncpg
        sync_url = DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
        print(f"⚙️  Alembic using sync PostgreSQL: {sync_url}")

    config_section = config.get_section(config.config_ini_section, {})
    config_section["sqlalchemy.url"] = sync_url

    connectable = engine_from_config(
        config_section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=Base.metadata,  # ✅ Импортируй Base из models, не из database.py
            render_as_batch=True,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()
