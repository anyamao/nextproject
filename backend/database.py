# backend/database.py

import os
from dotenv import load_dotenv
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine

load_dotenv()

IS_ALEMBIC = "ALEMBIC_SCRIPT_DIRECTORY" in os.environ
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = "sqlite+aiosqlite:///./dementia.db"

IS_SQLITE = DATABASE_URL.startswith("sqlite")
Base = declarative_base()

if IS_ALEMBIC or (IS_SQLITE and "+aiosqlite" not in DATABASE_URL):
    # === СИНХРОННЫЙ режим (для Alembic или sync SQLite) ===
    print(f"⚙️ Using SYNC engine: {DATABASE_URL}")

    if DATABASE_URL.startswith("sqlite+aiosqlite"):
        sync_url = DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")
    elif DATABASE_URL.startswith("postgresql+asyncpg"):
        sync_url = DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
    else:
        sync_url = DATABASE_URL

    engine = create_engine(
        sync_url,
        connect_args={"check_same_thread": False}
        if sync_url.startswith("sqlite")
        else {},
        echo=os.getenv("DEBUG", "False").lower() == "true",
        future=True,
    )

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def get_db():
        db = SessionLocal()
        try:
            yield db
            db.commit()  # ✅ Исправлено
        except:
            db.rollback()
            raise
        finally:
            db.close()

    def init_db():
        Base.metadata.create_all(bind=engine)  # ✅ Исправлено
        print("✅ Tables created (sync)")

else:
    # === АСИНХРОННЫЙ режим (для FastAPI + async PostgreSQL/SQLite) ===
    print(f"⚡ Using ASYNC engine: {DATABASE_URL}")

    engine = create_async_engine(
        DATABASE_URL,
        echo=os.getenv("DEBUG", "False").lower() == "true",
        connect_args={"check_same_thread": False}
        if DATABASE_URL.startswith("sqlite")
        else {},
        future=True,
    )

    SessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async def get_db():
        async with SessionLocal() as session:
            try:
                yield session
                await session.commit()
            except:
                await session.rollback()
                raise
            finally:
                await session.close()

    async def init_db():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)  # ✅ Исправлено
        print("✅ Tables created (async)")
