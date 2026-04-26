# backend/update_lesson_content.py
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

# ✅ Новый контент (вставь свой HTML)
NEW_CONTENT = """<div style="background-color: white; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 30px; border: 1px solid #e5e7eb; width: 100%; max-width: 1000px; margin: 10px 90px;">
  <p style="font-weight: 600; font-size: 25px;">
Unit 1. Grammar: Глагол to be, личные местоимения и построение предложений
  </p>
  <p style="margin-top: 10px; line-height: 1.6;">
В английском языке каждое предложение обязательно должно содержать сказуемое. В русском мы можем сказать «Я студент» или «Она дома», опуская глагол. В английском это невозможно. Вместо него всегда используется глагол to be (быть, являться, находиться). Он меняется в зависимости от подлежащего: I am, He/She/It is, You/We/They are. Запомните: to be не переводится как действие, он просто связывает подлежащее с описанием или местом. Например: I am happy (Я счастлив), She is a teacher (Она учитель), They are at home (Они дома). Это фундамент, на котором строится вся начальная грамматика.
  </p>
</div>

<div style="background-color: white; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 30px; border: 1px solid #e5e7eb; width: 100%; max-width: 1000px; margin: 10px 90px;">
  <p style="font-weight: 600; margin-top: 10px; background-color: #f3e8ff; padding: 8px; border-radius: 4px;">
 Личные местоимения и формы to be
  </p>
<p style="margin-top: 10px; line-height: 1.6;">
Английские местоимения строго соответствуют полу и числу. I (я), You (ты/вы), He (он), She (она), It (оно/это для предметов и животных), We (мы), They (они). Обратите внимание: You всегда означает и единственное, и множественное число. It используется для предметов, погоды, времени и животных (если пол не важен). Глагол to be принимает только три формы: am, is, are. Сочетания фиксированные: I + am, He/She/It + is, You/We/They + are. В разговорной речи почти всегда используются сокращения: I'm, you're, he's, she's, it's, we're, they're. Сокращения делают речь естественной, но в официальных текстах лучше писать полную форму.
  </p>
<p style="margin-top: 10px; line-height: 1.6;">
Отрицание образуется добавлением частицы not после to be: I am not tired, She is not here, We are not ready. В сокращённом виде это выглядит так: I'm not, She isn't (или She's not), We aren't (или We're not). Важно: never не используется вместе с to be в базовых предложениях A1 уровня, вместо этого достаточно простого not.
  </p>
</div>

<div style="background-color: white; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 30px; border: 1px solid #e5e7eb; width: 100%; max-width: 1000px; margin: 10px 90px;">
  <p style="font-weight: 600; margin-top: 10px; background-color: #f3e8ff; padding: 8px; border-radius: 4px;">
Вопросительные предложения и краткие ответы
  </p>
<p style="margin-top: 10px; line-height: 1.6;">
Чтобы задать вопрос с глаголом to be, не нужны вспомогательные слова вроде do или does. Достаточно просто поменять местами подлежащее и to be. Это называется инверсия. Утверждение: She is a student. Вопрос: Is she a student? Утверждение: They are at work. Вопрос: Are they at work? Ответы всегда краткие и повторяют подлежащее и форму to be: Yes, I am. / No, I'm not. Yes, he is. / No, he isn't. Никогда не отвечайте только Yes, I am without comma, или No, he is not. В английском краткий ответ — это готовая формула, которую нужно запомнить целиком.
  </p>
<p style="margin-top: 10px; line-height: 1.6;">
Частая ошибка на старте: использование do/does с to be (Do you happy? — неверно). Глагол to be самодостаточен, ему не нужны помощники. Ещё одна ошибка: путаница he/she при переводе с русского. В английском пол строго фиксируется местоимением. Если говорим о мужчине — всегда he, о женщине — always she. Практикуйте перестановку слов в уме, пока инверсия не станет автоматической.
  </p>
</div>

<div style="background-color: white; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 30px; border: 1px solid #e5e7eb; width: 100%; max-width: 1000px; margin: 10px 90px;">
  <p style="font-weight: 600; margin-top: 10px; background-color: #f3e8ff; padding: 8px; border-radius: 4px;">
 Универсальный алгоритм построения предложений
  </p>
<p style="margin-top: 10px; line-height: 1.6;">
Шаг 1. Определите подлежащее и выберите местоимение (I, you, he, she, it, we, they). Шаг 2. Подберите форму to be (am, is, are). Шаг 3. Добавьте дополнение или описание (профессия, прилагательное, место). Пример: I + am + a student → I am a student. Шаг 4. Если вопрос — поменяйте местами то, что на шаге 2 и 1: Am I a student? Шаг 5. Если отрицание — вставьте not после to be: I am not a student. Этот алгоритм работает для 90% базовых предложений уровня A1. Тренируйте его на простых примерах, пока мозг не начнёт собирать фразы автоматически.
  </p>
<p style="margin-top: 10px; line-height: 1.6;">
Запомните маркеры, после которых почти всегда идёт to be: возраст (I am 20), эмоции (She is happy), профессии (He is a doctor), местоположение (We are at school). Английский язык очень логичен: если вы видите описание состояния или положения, а не действие, ставьте to be.
  </p>
</div>"""

def update_lesson_content(lesson_slug: str, category_slug: str = "all-about-me", level_code: str = "A2", language_slug: str = "english"):
    with SessionLocal() as db:
        # Находим язык → уровень → категорию → урок
        language = db.execute(
            select(Language).where(Language.slug == language_slug)
        ).scalar_one_or_none()
        if not language:
            print(f"❌ Language '{language_slug}' not found")
            return

        level = db.execute(
            select(Level).where(
                Level.language_id == language.id,
                Level.code == level_code,
            )
        ).scalar_one_or_none()
        if not level:
            print(f"❌ Level '{level_code}' not found")
            return

        category = db.execute(
            select(Category).where(
                Category.slug == category_slug,
                Category.level_id == level.id,
            )
        ).scalar_one_or_none()
        if not category:
            print(f"❌ Category '{category_slug}' not found")
            return

        lesson = db.execute(
            select(LanguageLesson).where(
                LanguageLesson.slug == lesson_slug,
                LanguageLesson.category_id == category.id,
            )
        ).scalar_one_or_none()
        if not lesson:
            print(f"❌ Lesson '{lesson_slug}' not found in category '{category_slug}'")
            return

        # ✅ Обновляем контент
        old_content_preview = lesson.content[:100] + "..." if lesson.content else "None"
        lesson.content = NEW_CONTENT
        db.commit()
        
        print(f"✅ Lesson '{lesson_slug}' updated!")
        print(f"   Old content preview: {old_content_preview}")
        print(f"   New content length: {len(NEW_CONTENT)} chars")

if __name__ == "__main__":
    # 🔁 Укажи slug урока, который нужно обновить
    update_lesson_content(lesson_slug="grammar-basics")  # 👈 Поменяй на свой slug
