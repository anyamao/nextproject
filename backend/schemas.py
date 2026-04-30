from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime

from typing import Literal


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    username: str = Field(..., min_length=3)


class UserResponse(BaseModel):
    message: str
    email: str
    username: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    username: str
    avatar_url: str | None = "default_cat.jpg"  # ✅ Дефолтное значение
    status: str | None = None
    created_at: datetime | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=30)
    avatar_url: str | None = None  # ✅ Может быть null или имя файла
    status: str | None = Field(None, max_length=200)


# ЕГЭ СХЕМЫ СНИЗУ ege_native ###############"""


class EgeSubjectCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(
        ..., pattern=r"^[a-z0-9\-]+$", description="Только латиница, цифры, дефис"
    )
    description: str | None = Field(None, max_length=500)
    image: str | None = None


class EgeSubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    description: str | None
    image: str | None
    category: str | None = None
    created_at: datetime


class EgeSubjectList(BaseModel):
    subjects: list[EgeSubjectOut]
    total: int


class EgeLessonCreate(BaseModel):
    subject_id: int = Field(..., gt=0)  # gt=0 → больше нуля
    title: str = Field(..., min_length=3, max_length=200)
    slug: str = Field(
        ..., pattern=r"^[a-z0-9-]+$", description="Только латиница, цифры, дефис"
    )
    description: str | None = Field(None, max_length=500)
    content: str | None = None
    time_minutes: int | None = Field(None, ge=1, le=300)  # 1-300 минут
    test_id: int | None = None


class CourseUnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str  # "My Friends and Me"
    unit_number: int  # 1
    description: str | None = None
    lesson_count: int = 0  # опционально: количество уроков в юните


# 📤 Ответ: урок
class EgeLessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    subject_id: int | None = None
    title: str
    slug: str
    description: str | None
    content: str | None = None
    time_minutes: int | None
    is_completed: bool = False
    test_id: int | None
    unit: CourseUnitOut | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


# 📦 Список уроков для предмета
class EgeLessonList(BaseModel):
    subject_slug: str
    lessons: list[EgeLessonOut]


class TestQuestionCreate(BaseModel):
    question_text: str
    correct_answer: str
    order_index: int = 0


class EgeTestCreate(BaseModel):
    lesson_id: int
    title: str
    passing_score: int = 75
    questions: list[TestQuestionCreate] = []


class TestQuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    question_text: str
    order_index: int
    # ❌ correct_answer НЕ возвращаем клиенту!


class EgeTestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lesson_id: int
    title: str
    passing_score: int
    questions: list[TestQuestionOut] = []


class TestSubmissionResult(BaseModel):
    score: float  # Может быть дробным, например 75.5
    passed: bool
    total_questions: int
    correct_count: int


class TestSubmission(BaseModel):
    answers: dict[str, str]  # {question_id: "user_answer"}


class TestResultCreate(BaseModel):
    score: int = Field(..., ge=0, le=100)
    passed: bool
    # test_id и user_id берём из контекста (не от клиента)


class TestResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    score: int
    passed: bool
    completed_at: datetime


class LessonViewCreate(BaseModel):
    # Пустая схема — всё берём из контекста (токен + URL)
    pass


class LessonViewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    viewed_at: datetime


class ReactionCreate(BaseModel):
    reaction_type: str  # "like" или "dislike" (или "none" чтобы убрать)


class LessonStatsOut(BaseModel):
    likes: int
    dislikes: int
    user_reaction: str | None = None  # "like", "dislike" или None


##########Все для статей


ARTICLE_TOPICS = Literal["Забота о себе", "Продуктивность", "Наука", "Программирование"]


class ArticleCreate(BaseModel):
    title: str
    slug: str
    topic: ARTICLE_TOPICS
    content: str | None = None
    time_minutes: int | None = None
    image: str | None = None


class ArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    topic: str
    content: str | None
    time_minutes: int | None
    image: str | None
    created_at: datetime


class ArticleReactionCreate(BaseModel):
    reaction_type: str  # "like", "dislike", или "none"


class ArticleStatsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    likes: int
    dislikes: int
    views: int
    user_reaction: str | None = None  # "like", "dislike", или None


#########ВСЯ СВЯЗАННОЕ С КОММЕНТАРИЯМИ К УРОКАМ СНИЗУ
class CommentReactionCreate(BaseModel):
    reaction_type: str  # "like", "dislike", или "none"


class CommentWithStatsOut(BaseModel):
    """Комментарий + статистика реакций"""

    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    username: str
    content: str
    parent_id: int | None
    created_at: datetime
    updated_at: datetime | None
    # Статистика
    likes: int = 0
    dislikes: int = 0
    user_reaction: str | None = None  # "like", "dislike", или None
    # Вложенные ответы (рекурсивно)
    replies: list["CommentWithStatsOut"] = []


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: int | None = None  # для ответов на комментарии
    lesson_id: int | None = None  # ✅ Добавь это
    article_id: int | None = None  # ✅ И это


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    username: str  # добавим для удобства
    content: str
    parent_id: int | None
    created_at: datetime
    replies: list["CommentOut"] = []  # для вложенных ответов


# Для обновления списка на фронте
class CommentsListOut(BaseModel):
    comments: list[CommentOut]
    total: int


class LanguageLessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    description: str | None = None
    content: str | None = None
    time_minutes: int | None = None
    category_slug: str | None = None
    level_slug: str | None = None
    subject_slug: str | None = None


class LanguageCommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    username: str
    avatar_url: str | None = None
    content: str
    parent_id: int | None = None
    created_at: datetime
    updated_at: datetime | None = None
    likes: int = 0
    dislikes: int = 0
    user_reaction: Literal["like", "dislike", None] = None
    replies: list["LanguageCommentOut"] = []


# конец #######################################################


#########################

# экспорт не трогать!!!
__all__ = [
    "UserRegister",
    "UserLogin",
    "UserOut",
    "Token",
    "EgeSubjectCreate",
    "EgeSubjectOut",
    "EgeLessonCreate",
    "EgeLessonOut",
    "EgeLessonList",
    "TestQuestionCreate",
    "EgeTestCreate",
    "TestQuestionOut",
    "EgeTestOut",
    "TestSubmission",
    "TestResultOut",
    "TestResultCreate",
    "TestSubmissionResult",
    "LessonViewCreate",
    "LessonViewOut",
    "ReactionCreate",
    "LessonStatsOut",
    "ArticleCreate",
    "ArticleOut",
    "ArticleReactionCreate",
    "ArticleStatsOut",
    "CommentCreate",
    "CommentOut",
    "CommentReactionCreate",
    "CommentWithStatsOut",
    "UserUpdate",
    "UserOut",
    "CourseUnitOut",
    "LanguageLessonOut",
    "LanguageCommentOut",
]
