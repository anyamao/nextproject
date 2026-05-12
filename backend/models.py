from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    func,
    Text,
    UniqueConstraint,
    CheckConstraint,
    Float,
    Date,
)
from database import Base
from pydantic import BaseModel, EmailStr, Field, field_validator
import os
from dotenv import load_dotenv
from sqlalchemy.orm import DeclarativeBase, relationship, backref


# backend/models.py — в классе User


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    avatar_url = Column(String, nullable=True, default="default_cat.jpg")
    status = Column(String(200), nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    # 🔥 ДОБАВЛЯЕМ все отношения с cascade:

    # FlashcardProgress (уже есть, проверяем back_populates)
    flashcard_progress = relationship(
        "FlashcardProgress", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 TestResult
    test_results = relationship(
        "TestResult", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 LessonView
    lesson_views = relationship(
        "LessonView", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 LessonReaction
    lesson_reactions = relationship(
        "LessonReaction", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 Comment
    comments = relationship(
        "Comment", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 CommentReaction
    comment_reactions = relationship(
        "CommentReaction", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 ArticleView
    article_views = relationship(
        "ArticleView", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 ArticleReaction
    article_reactions = relationship(
        "ArticleReaction", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 UserCompletedLesson
    completed_lessons = relationship(
        "UserCompletedLesson", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 LanguageComment
    language_comments = relationship(
        "LanguageComment", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 LanguageCommentReaction
    language_comment_reactions = relationship(
        "LanguageCommentReaction", back_populates="user", cascade="all, delete-orphan"
    )

    # 🔥 LanguageLessonView
    language_lesson_views = relationship(
        "LanguageLessonView", back_populates="user", cascade="all, delete-orphan"
    )
    course_enrollments = relationship(
        "UserCourseEnrollment", back_populates="user", cascade="all, delete-orphan"
    )
    favorite_courses = relationship(
        "UserFavoriteCourse", back_populates="user", cascade="all, delete-orphan"
    )


# backend/models.py


class UserCourseEnrollment(Base):
    __tablename__ = "user_course_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    course_id = Column(
        Integer,
        ForeignKey("ege_subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    enrolled_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course_enrollment"),
    )

    user = relationship("User", back_populates="course_enrollments")
    course = relationship("EgeSubject", back_populates="enrollments")


class UserFavoriteCourse(Base):
    """Избранные курсы пользователей"""

    __tablename__ = "user_favorite_courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    course_id = Column(
        Integer,
        ForeignKey("ege_subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_favorite_course"),
    )

    user = relationship("User", back_populates="favorite_courses")
    course = relationship("EgeSubject", back_populates="favorites")


class CourseReview(Base):
    """Отзывы на курсы"""

    __tablename__ = "course_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    course_id = Column(
        Integer,
        ForeignKey("ege_subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course_review"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating_range"),
    )

    user = relationship("User")
    course = relationship("EgeSubject", back_populates="reviews")
    reactions = relationship(
        "ReviewReaction", back_populates="review", cascade="all, delete-orphan"
    )


# backend/models.py


class EgeSubject(Base):
    __tablename__ = "ege_subjects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=True)
    image = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    category = Column(String(50), nullable=True)
    about = Column(Text, nullable=True)  # 🔥 Добавь это!
    # 🔥 ДОБАВЬ ЭТИ ПОЛЯ:
    cover_image = Column(String(500), nullable=True)  # Обложка курса
    duration_minutes = Column(Integer, nullable=True)  # Время прохождения в минутах
    certificate_available = Column(Boolean, default=False, nullable=False)  # Сертификат
    teachers = relationship(
        "Teacher", secondary="course_teachers", back_populates="courses"
    )
    # Отношения
    units = relationship(
        "CourseUnit", back_populates="subject", cascade="all, delete-orphan"
    )
    lessons = relationship("EgeLesson", cascade="all, delete-orphan")

    # 🔥 НОВЫЕ отношения (для избранного, записей, отзывов):
    enrollments = relationship(
        "UserCourseEnrollment", back_populates="course", cascade="all, delete-orphan"
    )
    favorites = relationship(
        "UserFavoriteCourse", back_populates="course", cascade="all, delete-orphan"
    )
    reviews = relationship(
        "CourseReview", back_populates="course", cascade="all, delete-orphan"
    )


class Teacher(Base):
    """Преподаватель"""

    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    image = Column(String(500), nullable=True)
    about = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Связь с курсами
    courses = relationship(
        "EgeSubject", secondary="course_teachers", back_populates="teachers"
    )


class CourseTeacher(Base):
    """Связь курсов и учителей"""

    __tablename__ = "course_teachers"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(
        Integer,
        ForeignKey("ege_subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    teacher_id = Column(
        Integer,
        ForeignKey("teachers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("course_id", "teacher_id", name="uq_course_teacher"),
    )

    course = relationship("EgeSubject")
    teacher = relationship("Teacher")


class EgeLesson(Base):
    __tablename__ = "ege_lessons"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(
        Integer, ForeignKey("ege_subjects.id"), nullable=False, index=True
    )
    view_count = Column(Integer, default=0, nullable=False)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    unit_id = Column(Integer, ForeignKey("course_units.id"), nullable=True)
    unit = relationship("CourseUnit", back_populates="lessons")

    time_minutes = Column(Integer, nullable=True)
    test_id = Column(Integer, ForeignKey("ege_tests.id"), nullable=True)  # Просто FK
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    flashcard_deck = relationship(
        "FlashcardDeck", back_populates="lesson", uselist=False
    )
    test_results = relationship(
        "TestResult",
        back_populates="lesson",
        cascade="all, delete-orphan",
        lazy="select",
    )


class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("ege_lessons.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    lesson = relationship("EgeLesson", back_populates="flashcard_deck")
    cards = relationship(
        "Flashcard",
        back_populates="deck",
        cascade="all, delete-orphan",
        order_by="Flashcard.order_index",
    )


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("flashcard_decks.id"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    hint = Column(Text)
    example = Column(Text)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    deck = relationship("FlashcardDeck", back_populates="cards")

    progress = relationship(
        "FlashcardProgress", back_populates="card", cascade="all, delete-orphan"
    )


class FlashcardProgress(Base):
    __tablename__ = "flashcard_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    card_id = Column(Integer, ForeignKey("flashcards.id"), nullable=False)

    next_review = Column(Date)
    interval_days = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    repetitions = Column(Integer, default=0)

    times_seen = Column(Integer, default=0)
    times_correct = Column(Integer, default=0)
    last_answered = Column(DateTime)

    user = relationship("User", back_populates="flashcard_progress")

    card = relationship("Flashcard", back_populates="progress")


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    course_id = Column(
        Integer, ForeignKey("ege_subjects.id", ondelete="CASCADE"), primary_key=True
    )
    enrolled_at = Column(DateTime, server_default=func.now())
    user = relationship("User")
    course = relationship("EgeSubject")


class CourseUnit(Base):
    """Именованный юнит курса (например, "My Friends and Me")"""

    __tablename__ = "course_units"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("ege_subjects.id"), nullable=False)
    title = Column(String(100), nullable=False)  # "My Friends and Me"
    unit_number = Column(Integer, nullable=False)  # 1, 2, 3...
    description = Column(Text)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    subject = relationship("EgeSubject", back_populates="units")
    lessons = relationship(
        "EgeLesson", back_populates="unit", cascade="all, delete-orphan"
    )


class LanguageSubject(Base):
    __tablename__ = "language_subjects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    slug = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    image = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    levels = relationship(
        "LanguageLevel", back_populates="subject", cascade="all, delete-orphan"
    )


class LanguageLevel(Base):
    __tablename__ = "language_levels"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("language_subjects.id"), nullable=False)
    title = Column(String(20), nullable=False)
    slug = Column(String(20), nullable=False)
    description = Column(Text)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    subject = relationship("LanguageSubject", back_populates="levels")
    categories = relationship(
        "LanguageCategory", back_populates="level", cascade="all, delete-orphan"
    )


class LanguageCategory(Base):
    __tablename__ = "language_categories"
    id = Column(Integer, primary_key=True, index=True)
    level_id = Column(Integer, ForeignKey("language_levels.id"), nullable=False)
    title = Column(String(100), nullable=False)
    slug = Column(String(50), nullable=False)
    description = Column(Text)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    level = relationship("LanguageLevel", back_populates="categories")
    lessons = relationship(
        "LanguageLesson", back_populates="category", cascade="all, delete-orphan"
    )


class LanguageLesson(Base):
    __tablename__ = "language_lessons"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("language_categories.id"), nullable=False)
    title = Column(String(200), nullable=False)
    slug = Column(String(100), nullable=False)
    content = Column(Text)
    description = Column(Text)
    time_minutes = Column(Integer)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    category = relationship("LanguageCategory", back_populates="lessons")
    comments = relationship(
        "LanguageComment", back_populates="lesson", cascade="all, delete-orphan"
    )
    views = relationship(
        "LanguageLessonView", back_populates="lesson", cascade="all, delete-orphan"
    )


class LanguageComment(Base):
    __tablename__ = "language_comments"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("language_lessons.id"), nullable=False)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("language_comments.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    lesson = relationship("LanguageLesson", back_populates="comments")
    user = relationship("User", back_populates="language_comments")
    replies = relationship(
        "LanguageComment", backref=backref("parent", remote_side=[id])
    )
    reactions = relationship(
        "LanguageCommentReaction",
        back_populates="comment",
        cascade="all, delete-orphan",
    )


class LanguageCommentReaction(Base):
    __tablename__ = "language_comment_reactions"
    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("language_comments.id"), nullable=False)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    is_like = Column(Boolean, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    comment = relationship("LanguageComment", back_populates="reactions")
    user = relationship("User", back_populates="language_comment_reactions")


class LanguageLessonView(Base):
    __tablename__ = "language_lesson_views"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("language_lessons.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    viewed_at = Column(DateTime, server_default=func.now())
    ip_address = Column(String(45))

    lesson = relationship("LanguageLesson", back_populates="views")
    user = relationship("User", back_populates="language_lesson_views")


class EgeTest(Base):
    __tablename__ = "ege_tests"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(
        Integer,
        ForeignKey("ege_lessons.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    title = Column(String, nullable=False)
    passing_score = Column(Integer, default=75)
    created_at = Column(DateTime, server_default=func.now())

    # ✅ Эта связь нужна: тест → вопросы
    questions = relationship(
        "EgeTestQuestion", back_populates="test", cascade="all, delete-orphan"
    )


class EgeTestQuestion(Base):
    __tablename__ = "ege_test_questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(
        Integer, ForeignKey("ege_tests.id", ondelete="CASCADE"), nullable=False
    )
    question_text = Column(Text, nullable=False)
    correct_answer = Column(String, nullable=False)
    order_index = Column(Integer, default=0)
    solution = Column(Text, nullable=True)
    test = relationship("EgeTest", back_populates="questions")


class LessonView(Base):
    __tablename__ = "lesson_views"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lesson_id = Column(
        Integer,
        ForeignKey("ege_lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user = relationship("User", back_populates="lesson_views")
    lesson = relationship("EgeLesson")


class LessonReaction(Base):
    __tablename__ = "lesson_reactions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lesson_id = Column(
        Integer,
        ForeignKey("ege_lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    is_like = Column(Boolean, nullable=False)

    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_reaction"),
    )
    user = relationship("User", back_populates="lesson_reactions")
    lesson = relationship("EgeLesson")

    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_view"),
    )


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    topic = Column(String(50), nullable=False, index=True)
    content = Column(Text, nullable=True)
    time_minutes = Column(Integer, nullable=True)
    image = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class ArticleView(Base):
    __tablename__ = "article_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    article_id = Column(
        Integer,
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    viewed_at = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="article_views")
    article = relationship("Article")

    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="uq_user_article_view"),
    )


class ArticleReaction(Base):
    __tablename__ = "article_reactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    article_id = Column(
        Integer,
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_like = Column(Boolean, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="article_reactions")
    article = relationship("Article")

    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="uq_user_article_reaction"),
    )


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("ege_lessons.id"), nullable=True)

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    test_id = Column(
        Integer,
        ForeignKey("ege_tests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    score = Column(Integer, nullable=False)  # 0-100
    passed = Column(Boolean, nullable=False)
    completed_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="test_results")
    test = relationship("EgeTest")
    lesson = relationship("EgeLesson", back_populates="test_results")  # опционально
    __table_args__ = ()


class ReviewReaction(Base):
    """Лайки/дизлайки к отзывам"""

    __tablename__ = "review_reactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    review_id = Column(
        Integer, ForeignKey("course_reviews.id", ondelete="CASCADE"), nullable=False
    )
    reaction_type = Column(String(10), nullable=False)  # "like" или "dislike"
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "review_id", name="uq_user_review_reaction"),
    )

    user = relationship("User")
    review = relationship("CourseReview", back_populates="reactions")


class UserCompletedLesson(Base):
    __tablename__ = "user_completed_lessons"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id = Column(Integer, ForeignKey("ege_lessons.id"), nullable=False)
    completed_at = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="completed_lessons")
    lesson = relationship("EgeLesson")
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_completed"),
    )


class CommentReaction(Base):
    __tablename__ = "comment_reactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    comment_id = Column(
        Integer,
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_like = Column(Boolean, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="comment_reactions")
    comment = relationship("Comment")

    __table_args__ = (
        UniqueConstraint("user_id", "comment_id", name="uq_user_comment_reaction"),
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    lesson_id = Column(
        Integer,
        ForeignKey("ege_lessons.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    article_id = Column(
        Integer,
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    content = Column(Text, nullable=False)
    parent_id = Column(
        Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True
    )  # для ответов
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    user = relationship("User", back_populates="comments")
    lesson = relationship("EgeLesson")
    article = relationship("Article")
    parent = relationship("Comment", remote_side=[id], backref="replies")

    __table_args__ = (
        CheckConstraint(
            "(lesson_id IS NOT NULL AND article_id IS NULL) OR (lesson_id IS NULL AND article_id IS NOT NULL)",
            name="check_commentable_type",
        ),
    )
