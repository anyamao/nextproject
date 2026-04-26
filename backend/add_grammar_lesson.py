# backend/add_grammar_lesson.py
from sqlalchemy import select, create_engine
from sqlalchemy.orm import sessionmaker
from models import Language, Level, Category, LanguageLesson, Base
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dementia.db")

# Конвертируем async URL в sync
if DATABASE_URL.startswith("sqlite+aiosqlite"):
    DATABASE_URL = DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_grammar_lesson():
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

        # Находим категорию "all-about-me"
        category = db.execute(
            select(Category).where(
                Category.slug == "all-about-me",
                Category.level_id == level.id,
            )
        ).scalar_one_or_none()
        if not category:
            print("❌ Category 'all-about-me' not found")
            return

        # Проверяем, нет ли уже урока "grammar"
        existing = db.execute(
            select(LanguageLesson).where(
                LanguageLesson.slug == "grammar-basics",
                LanguageLesson.category_id == category.id,
            )
        ).scalar_one_or_none()
        if existing:
            print("✅ Lesson 'grammar-basics' already exists")
            return

        # Создаём урок
        new_lesson = LanguageLesson(
            slug="grammar-basics",
            title="Grammar Basics",
            description="Learn basic English grammar: present simple, pronouns, articles",
            content="""# Grammar Basics

## Present Simple

Use Present Simple for:
- Habits: *I drink coffee every morning*
- Facts: *Water boils at 100°C*
- General truths: *The sun rises in the east*

### Form:
| Subject | Verb |
|---------|------|
| I/You/We/They | work |
| He/She/It | work**s** |

## Pronouns
| Subject | Object | Possessive |
|---------|--------|------------|
| I | me | my |
| You | you | your |
| He | him | his |
| She | her | her |
| It | it | its |
| We | us | our |
| They | them | their |

## Articles
- **a/an** — indefinite (first mention)
- **the** — definite (specific thing)

### Practice:
1. She ___ (work) in a bank.
2. ___ sun is bright today.
3. I have ___ apple.

<details>
<summary>Answers</summary>
1. works  2. The  3. an
</details>
""",
            estimated_minutes=20,
            order_number=1,
            language_id=language.id,
            level_id=level.id,
            category_id=category.id,
            is_published=True,
        )
        db.add(new_lesson)
        db.commit()
        print(f"✅ Lesson created: {new_lesson.title} (slug: {new_lesson.slug}, id: {new_lesson.id})")

if __name__ == "__main__":
    add_grammar_lesson()
