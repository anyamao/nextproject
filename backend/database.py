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
    DATABASE_URL = "sqlite:///./dementia.db"  # 🔁 SYNC по дефолту

IS_SQLITE = DATABASE_URL.startswith("sqlite")
Base = declarative_base()

# === СИНХРОННЫЙ режим (для SQLite) ===
print(f"⚙️ Using SYNC engine: {DATABASE_URL}")

sync_url = DATABASE_URL.replace("sqlite+aiosqlite", "sqlite") if "aiosqlite" in DATABASE_URL else DATABASE_URL

engine = create_engine(
    sync_url,
    connect_args={"check_same_thread": False} if sync_url.startswith("sqlite") else {},
    echo=os.getenv("DEBUG", "False").lower() == "true",
    future=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except:
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created (sync)")
