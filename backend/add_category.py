# backend/add_category.py
from sqlalchemy import select, create_engine
from sqlalchemy.orm import sessionmaker
from models import Language, Level, Category, Base
import os

# 🔁 Читаем DATABASE_URL из .env
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dementia.db")

# 🔁 Конвертируем async URL в sync, если нужно
if DATABASE_URL.startswith("sqlite+aiosqlite"):
    DATABASE_URL = DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")

# 🔁 Создаём синхронный движок
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_category():
    with SessionLocal() as db:
        # Находим английский
        language = db.execute(
            select(Language).where(Language.slug == "english")
        ).scalar_one_or_none()
        
        if not language:
            print("❌ English not found")
            return

        # Находим уровень A2
        level = db.execute(
            select(Level).where(
                Level.language_id == language.id,
                Level.code == "A2",
            )
        ).scalar_one_or_none()
        
        if not level:
            print("❌ A2 level not found")
            return

        # Проверяем, нет ли уже категории
        existing = db.execute(
            select(Category).where(
                Category.slug == "all-about-me",
                Category.level_id == level.id,
            )
        ).scalar_one_or_none()
        
        if existing:
            print("✅ Category already exists")
            return

        # Создаём категорию
        new_category = Category(
            slug="all-about-me",
            name="All About Me",
            description="Learn to talk about yourself: name, age, family, hobbies, and daily routines",
            order_number=2,
            language_id=language.id,
            level_id=level.id,
            is_published=True,
        )
        db.add(new_category)
        db.commit()
        print(f"✅ Category created: {new_category.name} (id={new_category.id})")

if __name__ == "__main__":
    add_category()
