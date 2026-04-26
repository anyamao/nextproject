from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    func,
    Text,
)
from database import Base
from pydantic import BaseModel, EmailStr, Field, field_validator
import os
from dotenv import load_dotenv
from sqlalchemy.orm import DeclarativeBase, relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


##ЭТО МЕСТО ДЛЯ ВСЕГО ЧТО СВЯЗАНО С ege_native ЕГЭ!!!!!!###"""


class EgeSubject(Base):
    __tablename__ = "ege_subjects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=True)
    image = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # ❌ УДАЛИТЕ back_populates, если в EgeLesson нет обратной связи:
    # ✅ Просто список уроков (без back_populates — безопасно)
    lessons = relationship("EgeLesson", cascade="all, delete-orphan")


class EgeLesson(Base):
    __tablename__ = "ege_lessons"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(
        Integer, ForeignKey("ege_subjects.id"), nullable=False, index=True
    )
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    time_minutes = Column(Integer, nullable=True)
    test_id = Column(Integer, ForeignKey("ege_tests.id"), nullable=True)  # Просто FK
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


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

    # ✅ Обратная связь на тест (единственная, которая нужна с back_populates)
    test = relationship("EgeTest", back_populates="questions")


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)

    # 🔗 Связи
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    test_id = Column(
        Integer,
        ForeignKey("ege_tests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # 📊 Результат
    score = Column(Integer, nullable=False)  # 0-100
    passed = Column(Boolean, nullable=False)
    completed_at = Column(DateTime, server_default=func.now())

    # 🔗 Relationships (опционально, если нужно)
    user = relationship("User")
    test = relationship("EgeTest")

    # ✅ Уникальность: один результат на пользователя на тест (последний перезаписывается)
    __table_args__ = (
        # Если пользователь проходит тест повторно — обновляем старую запись (UPSERT)
        # Это реализуется на уровне запроса, не через unique constraint
    )
