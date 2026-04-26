from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, Text
from database import Base
from pydantic import BaseModel, EmailStr, Field, field_validator


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
