# backend/add_test_to_lesson.py
from sqlalchemy import select, create_engine
from sqlalchemy.orm import sessionmaker
from models import Language, Level, Category, LanguageLesson, Test, Question, Base
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dementia.db")

# 🔁 Convert async URL to sync if needed
if DATABASE_URL.startswith("sqlite+aiosqlite"):
    DATABASE_URL = DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_test_to_lesson():
    with SessionLocal() as db:
        # 1️⃣ Find language → level → category → lesson
        language = db.execute(select(Language).where(Language.slug == "english")).scalar_one_or_none()
        if not language: return print("❌ English not found")

        level = db.execute(select(Level).where(Level.language_id == language.id, Level.code == "A2")).scalar_one_or_none()
        if not level: return print("❌ A2 level not found")

        category = db.execute(select(Category).where(Category.slug == "all-about-me", Category.level_id == level.id)).scalar_one_or_none()
        if not category: return print("❌ Category 'all-about-me' not found")

        lesson = db.execute(select(LanguageLesson).where(LanguageLesson.slug == "grammar-basics", LanguageLesson.category_id == category.id)).scalar_one_or_none()
        if not lesson: return print("❌ Lesson 'grammar-basics' not found")

        # 2️⃣ Check if test already exists
        existing_test = db.execute(select(Test).where(Test.lesson_id == lesson.id)).scalar_one_or_none()
        if existing_test:
            return print(f"✅ Test already exists for this lesson (ID: {existing_test.id})")

        # 3️⃣ Create Test
        test = Test(
            title="Grammar Basics: To Be & Pronouns",
            description="Check your understanding of basic English grammar: present simple, pronouns, and sentence structure.",
            lesson_id=lesson.id,  # 🔗 Links test to language lesson
            passing_score=70,
            time_limit_minutes=10,
            is_published=True
        )
        db.add(test)
        db.flush()  # 🔁 Get test.id before adding questions

        # 4️⃣ Add Questions (grammar-focused)
        questions_data = [
            {
                "text": "Which form of 'to be' is used with 'She'?",
                "options": ["am", "is", "are", "be"],
                "correct": "is",
                "explanation": "We use 'is' with he, she, and it."
            },
            {
                "text": "How do you make a negative sentence from 'I am happy'?",
                "options": ["I no am happy", "I am not happy", "I not am happy", "I am no happy"],
                "correct": "I am not happy",
                "explanation": "Add 'not' after the verb 'to be'."
            },
            {
                "text": "Turn this into a question: 'They are at work.'",
                "options": ["Do they at work?", "Are they at work?", "They are at work?", "Is they at work?"],
                "correct": "Are they at work?",
                "explanation": "Swap the subject and the verb 'to be' to form a question."
            },
            {
                "text": "Which pronoun do we use for objects, animals, or weather?",
                "options": ["He", "She", "They", "It"],
                "correct": "It",
                "explanation": "'It' is used for non-human things, animals, weather, and time."
            },
            {
                "text": "Choose the correct article: 'She is ___ teacher.'",
                "options": ["a", "an", "the", "-"],
                "correct": "a",
                "explanation": "Use 'a' before consonant sounds for professions."
            }
        ]

        for i, q_data in enumerate(questions_data, 1):
            q = Question(
                test_id=test.id,
                question_text=q_data["text"],
                question_type="multiple_choice",
                answer_type="multiple_choice",
                option_a=q_data["options"][0],
                option_b=q_data["options"][1],
                option_c=q_data["options"][2],
                option_d=q_data["options"][3],
                correct_answer=q_data["correct"],
                explanation=q_data["explanation"],
                order_number=i
            )
            db.add(q)

        # 5️⃣ Link test to lesson
        lesson.test_id = test.id
        db.commit()

        print(f"✅ Test created successfully!")
        print(f"   📝 Test ID: {test.id}")
        print(f"   📚 Questions added: {len(questions_data)}")
        print(f"   🔗 Linked to lesson: {lesson.title} (slug: {lesson.slug})")

if __name__ == "__main__":
    add_test_to_lesson()
