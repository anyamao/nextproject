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
    title = Column(String(100), nullable=False)  # Название: "Математика профиль"
    slug = Column(
        String(100), unique=True, index=True, nullable=False
    )  # "math-profile"
    description = Column(Text, nullable=True)  # Описание курса
    image = Column(String(255), nullable=True)  # URL картинки: "/subjects/math.png"
    created_at = Column(DateTime, server_default=func.now())
    lessons = relationship(
        "EgeLesson", back_populates="subject", cascade="all, delete-orphan"
    )


class EgeLesson(Base):
    __tablename__ = "ege_lessons"

    id = Column(Integer, primary_key=True, index=True)

    # 🔗 Связь с предметом (обязательная)
    subject_id = Column(
        Integer, ForeignKey("ege_subjects.id"), nullable=False, index=True
    )

    # 📝 Контент урока
    title = Column(String, nullable=False)  # "Задание 4: Теория вероятностей"
    slug = Column(
        String, unique=True, nullable=False, index=True
    )  # "theory-of-probability-4"
    description = Column(String, nullable=True)  # Краткое описание
    content = Column(Text, nullable=True)  # Полный контент (можно Markdown/HTML)
    time_minutes = Column(Integer, nullable=True)  # Время в минутах

    # 🧪 Опциональная связь с тестом (будет в будущем)
    test_id = Column(
        Integer, nullable=True
    )  # Пока просто nullable, позже — ForeignKey("ege_tests.id")

    # 📅 Метаданные
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # 🔗 SQLAlchemy relationship (удобно для eager loading)
    subject = relationship("EgeSubject", back_populates="lessons")
