# models/__init__.py

from models.user import User
from models.course import (
    Course,
    Lesson,
    UserCourseProgress,
    LessonProgress,
    user_favorites,
)

__all__ = [
    "User",
    "Course",
    "Lesson",
    "UserCourseProgress",
    "LessonProgress",
    "user_favorites",
]
