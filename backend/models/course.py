# models/course.py

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Text,
    Float,
    ForeignKey,
    Table,
)
from sqlalchemy.orm import relationship, selectinload
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.sql import func
from core.database import Base

# 🔥 Связующая таблица для избранных курсов
user_favorites = Table(
    "user_favorites",
    Base.metadata,
    Column(
        "user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "course_id",
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("created_at", TIMESTAMP(timezone=True), server_default=func.now()),
)


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    image = Column(String(500), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    difficulty = Column(String(20), nullable=True)
    certificate_available = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)
    enrolled_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # 🔥 Связи (без lazy loading проблем)
    lessons = relationship(
        "Lesson", back_populates="course", cascade="all, delete-orphan", lazy="selectin"
    )
    favorites = relationship(
        "User",
        secondary=user_favorites,
        back_populates="favorite_courses",
        lazy="selectin",
    )
    enrollments = relationship(
        "UserCourseProgress",
        back_populates="course",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Course {self.title}>"

    def to_dict(self, user_id: int = None, include_progress: bool = False):
        """Конвертация в словарь - БЕЗ ЛЕНИВЫХ ЗАГРУЗОК"""
        result = {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "description": self.description,
            "category": self.category,
            "image": self.image,
            "duration_minutes": self.duration_minutes,
            "certificate_available": self.certificate_available,
            "rating": self.rating,
            "enrolled_count": self.enrolled_count,
            "difficulty": self.difficulty,
        }

        # 🔥 Проверяем, загружены ли связи, используем getattr с default
        if user_id:
            enrollments = getattr(self, "enrollments", [])
            favorites = getattr(self, "favorites", [])

            result["is_enrolled"] = any(e.user_id == user_id for e in enrollments)
            result["is_favorite"] = any(f.id == user_id for f in favorites)

            if include_progress:
                progress = next((e for e in enrollments if e.user_id == user_id), None)
                result["completion_percent"] = (
                    progress.completion_percent if progress else 0
                )
                result["last_accessed"] = (
                    progress.updated_at.isoformat()
                    if progress and progress.updated_at
                    else None
                )
            else:
                result["completion_percent"] = 0

        return result


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=True)
    order_index = Column(Integer, default=0)
    duration_minutes = Column(Integer, nullable=True)
    is_free = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    course = relationship("Course", back_populates="lessons", lazy="selectin")
    progress = relationship(
        "LessonProgress",
        back_populates="lesson",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Lesson {self.title}>"


class UserCourseProgress(Base):
    __tablename__ = "user_course_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    completion_percent = Column(Integer, default=0)
    last_accessed_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())
    started_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    is_completed = Column(Boolean, default=False)

    user = relationship("User", back_populates="course_progress", lazy="selectin")
    course = relationship("Course", back_populates="enrollments", lazy="selectin")
    lessons = relationship(
        "LessonProgress",
        back_populates="course_progress",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<UserCourseProgress user={self.user_id} course={self.course_id}>"


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id = Column(
        Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    course_progress_id = Column(
        Integer,
        ForeignKey("user_course_progress.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_completed = Column(Boolean, default=False)
    time_spent_seconds = Column(Integer, default=0)
    last_position = Column(Integer, default=0)
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)

    lesson = relationship("Lesson", back_populates="progress", lazy="selectin")
    course_progress = relationship(
        "UserCourseProgress", back_populates="lessons", lazy="selectin"
    )
