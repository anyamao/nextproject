# backend/models.py

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    func,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship  # ✅ Важно!
from database import Base


class User(Base):
    """Модель пользователя для аутентификации"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    test_results = relationship(
        "TestResult", back_populates="user", cascade="all, delete-orphan"
    )
    feedback = relationship(
        "LessonFeedback", back_populates="user", cascade="all, delete-orphan"
    )
    views = relationship(
        "LessonView", back_populates="user", cascade="all, delete-orphan"
    )


# backend/models.py
class LessonView(Base):
    __tablename__ = "lesson_views"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String, nullable=True)  # ✅ For anonymous tracking
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())

    # ✅ Fixed __table_args__ (Removed the 'else ()' part)
    __table_args__ = (
        UniqueConstraint("lesson_id", "user_id", name="uq_lesson_view_user"),
        UniqueConstraint("lesson_id", "session_id", name="uq_lesson_view_anon"),
    )

    lesson = relationship("Lesson", back_populates="views")
    user = relationship("User", back_populates="views")


class LessonFeedback(Base):
    """Реакции пользователей на уроки (Понятно/Не понятно)"""

    __tablename__ = "lesson_feedback"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(
        Integer, ForeignKey("lessons.id"), nullable=False
    )  # Для EGE-уроков
    language_lesson_id = Column(
        Integer, ForeignKey("language_lessons.id"), nullable=True
    )  # Для языковых
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    feedback_type = Column(String, nullable=False)  # "clear" или "unclear"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Уникальная комбинация: один пользователь — одна реакция на урок
    __table_args__ = (
        UniqueConstraint("lesson_id", "user_id", name="uq_lesson_user"),
        UniqueConstraint("language_lesson_id", "user_id", name="uq_lang_lesson_user"),
    )

    # Отношения
    user = relationship("User", back_populates="feedback")
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)  # Для EGE
    language_lesson_id = Column(
        Integer, ForeignKey("language_lessons.id"), nullable=True
    )  # Для языков

    # 🔗 Два отношения
    lesson = relationship("Lesson", back_populates="feedback", foreign_keys=[lesson_id])
    language_lesson = relationship(
        "LanguageLesson", back_populates="feedback", foreign_keys=[language_lesson_id]
    )


# backend/models.py


class Level(Base):
    """Модель уровня языка (A1, A2, B1, B2, C1)"""

    __tablename__ = "levels"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False)  # "A1", "A2", "B1", etc.
    name = Column(String, nullable=False)  # "Beginner", "Elementary", etc.
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)  # Для сортировки
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=False)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Отношения
    language = relationship("Language", back_populates="levels")
    categories = relationship(
        "Category", back_populates="level", cascade="all, delete-orphan"
    )  # ✅ Добавили!
    language_lessons = relationship(
        "LanguageLesson", back_populates="level", cascade="all, delete-orphan"
    )


# backend/models.py


class Category(Base):
    """Модель категории/темы внутри уровня языка"""

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, nullable=False)  # "greetings", "numbers", etc.
    name = Column(String, nullable=False)  # "Приветствия", "Числа", etc.
    description = Column(Text, nullable=True)
    order_number = Column(Integer, default=0)  # Для сортировки
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=False)
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=False)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Отношения
    language = relationship("Language", back_populates="categories")
    level = relationship("Level", back_populates="categories")
    language_lessons = relationship(
        "LanguageLesson", back_populates="category", cascade="all, delete-orphan"
    )


# Добавь обратные отношения в существующие модели:
# В class Language(Base):


# В class Level(Base):


class Language(Base):
    """Модель языка"""

    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(
        String, unique=True, index=True, nullable=False
    )  # "english", "spanish", etc.
    name = Column(String, nullable=False)  # "Английский", "Испанский"
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)  # URL иконки (флаг)
    image = Column(String, nullable=False, default="/language-placeholder.png")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # В class Language(Base): добавь:
    levels = relationship(
        "Level", back_populates="language", cascade="all, delete-orphan"
    )
    categories = relationship(
        "Category", back_populates="language", cascade="all, delete-orphan"
    )
    language_lessons = relationship(
        "LanguageLesson", back_populates="language", cascade="all, delete-orphan"
    )


class Article(Base):
    """Модель статьи"""

    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, default="Общее")
    time = Column(String, default="5 мин")
    text = Column(Text, nullable=False)
    image = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Course(Base):
    """Модель курса"""

    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    image = Column(String, nullable=False, default="/course-placeholder.png")
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 🔗 Отношение с уроками
    lessons = relationship(
        "Lesson", back_populates="course", cascade="all, delete-orphan"
    )


# backend/models.py


class LanguageLesson(Base):
    """Модель урока внутри категории языка"""

    __tablename__ = "language_lessons"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, nullable=False)  # "greetings-basics", "numbers-1-10", etc.
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)  # Полный текст урока (Markdown/HTML)
    estimated_minutes = Column(Integer, default=10)
    order_number = Column(Integer, default=0)  # Для сортировки внутри категории
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=False)
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    view_count = Column(Integer, default=0, nullable=False)
    lesson_type = Column(String, default="language")  # "ege" или "language"
    # Отношения
    language = relationship("Language", back_populates="language_lessons")
    level = relationship("Level", back_populates="language_lessons")
    category = relationship("Category", back_populates="language_lessons")
    test = relationship(
        "Test",
        back_populates="language_lesson",
        foreign_keys="[Test.lesson_id]",  # ✅ Важно!
        uselist=False,
    )
    feedback = relationship(
        "LessonFeedback", back_populates="language_lesson", cascade="all, delete-orphan"
    )


# Добавь обратные отношения в существующие модели:
# В class Language(Base):

# В class Level(Base):


class Lesson(Base):
    """Модель урока внутри курса"""

    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    estimated_minutes = Column(Integer, default=30)
    content = Column(Text, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    order_number = Column(Integer, default=0)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=True)  # ✅ Добавили!
    # 🔗 Отношение с курсом
    view_count = Column(Integer, default=0)  # 🔁 Кэшированный счётчик
    lesson_type = Column(String, default="ege")  # "ege" или "language"
    # Отношение
    views = relationship(
        "LessonView", back_populates="lesson", cascade="all, delete-orphan"
    )
    course = relationship("Course", back_populates="lessons")
    test = relationship(
        "Test",
        back_populates="course_lesson",
        foreign_keys="[Test.course_lesson_id]",  # ✅ Важно!
        uselist=False,
    )
    feedback = relationship(
        "LessonFeedback", back_populates="lesson", cascade="all, delete-orphan"
    )


# backend/models.py


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # 🔗 Два разных внешних ключа для разных типов уроков
    lesson_id = Column(
        Integer, ForeignKey("language_lessons.id"), nullable=True
    )  # Для языков
    course_lesson_id = Column(
        Integer, ForeignKey("lessons.id"), nullable=True
    )  # Для курсов/ЕГЭ

    passing_score = Column(Integer, default=70)
    time_limit_minutes = Column(Integer, nullable=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 🔗 Отношения — явно указываем foreign_keys!
    language_lesson = relationship(
        "LanguageLesson",
        back_populates="test",
        foreign_keys="[Test.lesson_id]",  # ✅ Для языковых уроков
        uselist=False,
    )

    course_lesson = relationship(
        "Lesson",
        back_populates="test",
        foreign_keys="[Test.course_lesson_id]",  # ✅ Для курсов/ЕГЭ
        uselist=False,
    )

    questions = relationship(
        "Question", back_populates="test", cascade="all, delete-orphan"
    )
    results = relationship(
        "TestResult", back_populates="test", cascade="all, delete-orphan"
    )


class Question(Base):
    """Модель вопроса теста"""

    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(
        String, default="multiple_choice"
    )  # "multiple_choice", "input"
    answer_type = Column(String, nullable=True)  # "text", "number", "decimal"
    option_a = Column(String, nullable=True)
    option_b = Column(String, nullable=True)
    option_c = Column(String, nullable=True)
    option_d = Column(String, nullable=True)
    correct_answer = Column(
        String, nullable=False
    )  # Храним правильный ответ (в продакшене лучше хэшировать или проверять на бэкенде)
    explanation = Column(Text, nullable=True)  # Объяснение правильного ответа
    order_number = Column(Integer, default=0)

    test = relationship("Test", back_populates="questions")


class TestResult(Base):
    """Результат прохождения теста пользователем"""

    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)  # Результат в %
    passed = Column(Boolean, nullable=False)
    answers = Column(JSON, nullable=True)  # Сохраняем ответы пользователя
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    test = relationship("Test", back_populates="results")
    user = relationship("User", back_populates="test_results")
