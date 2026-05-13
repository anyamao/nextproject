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
    avatar_url: str | None = "default_cat.jpg"
    status: str | None = None
    created_at: datetime | None = None
    first_name: str | None = None
    last_name: str | None = None
    token_balance: int = 0
    about_me: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenReward(BaseModel):
    """Начисление токенов"""

    amount: int = Field(..., ge=1, le=1000)
    reason: str = Field(..., max_length=200)  # Например: "first_course_enrolled"


class UserUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=30)
    avatar_url: str | None = None
    status: str | None = Field(None, max_length=200)
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    about_me: str | None = Field(None, max_length=2000)


class EgeSubjectCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(
        ..., pattern=r"^[a-z0-9\-]+$", description="Только латиница, цифры, дефис"
    )
    description: str | None = Field(None, max_length=500)
    image: str | None = None


# backend/schemas.py


class EgeSubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    description: str | None
    image: str | None
    category: str | None = None
    created_at: datetime
    completion_percent: float | None = None
    is_enrolled: bool | None = None
    # 🔥 Новые поля:
    certificate_available: bool = False
    duration_minutes: int | None = None
    enrolled_count: int | None = None
    rating: float | None = None
    is_favorite: bool | None = None


class EgeLessonCreate(BaseModel):
    subject_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=3, max_length=200)
    slug: str = Field(
        ..., pattern=r"^[a-z0-9-]+$", description="Только латиница, цифры, дефис"
    )
    description: str | None = Field(None, max_length=500)
    content: str | None = None
    time_minutes: int | None = Field(None, ge=1, le=300)
    test_id: int | None = None


class CourseUnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    unit_number: int  # 1
    description: str | None = None
    lesson_count: int = 0


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
    is_locked: bool = False  # 🔥 Добавили поле с дефолтом


# backend/schemas.py


class ReviewOut(BaseModel):
    """Полный отзыв с реакциями"""

    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    username: str
    avatar_url: str | None = None
    rating: int
    comment: str
    created_at: datetime
    updated_at: datetime | None = None
    # 🔥 Реакции:
    likes: int = 0
    dislikes: int = 0
    user_reaction: str | None = None  # "like" | "dislike" | None


class TeacherOut(BaseModel):
    """Информация о преподавателе"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    image: str | None = None
    about: str | None = None


class ReviewStatsOut(BaseModel):
    """Статистика отзывов"""

    model_config = ConfigDict(from_attributes=True)
    reviews: list[ReviewOut]  # 🔥 Добавь это поле!
    stats: dict  # { average_rating, total_reviews, user_review }


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=50, max_length=2000)


class ReviewUpdate(BaseModel):
    rating: int | None = Field(None, ge=1, le=5)
    comment: str | None = Field(None, min_length=50, max_length=2000)


class PromoCourseOut(BaseModel):
    """Данные для промо-страницы курса"""

    model_config = ConfigDict(from_attributes=True)
    completion_percent: float | None = None
    id: int
    title: str
    slug: str
    description: str | None
    image: str | None
    category: str | None
    duration_minutes: int | None
    certificate_available: bool
    enrolled_count: int = 0
    rating: float | None = None
    is_favorite: bool = False
    about: str | None = None  # 🔥 Новое поле
    is_enrolled: bool = False
    teachers: list[TeacherOut] = []  # 🔥 Список учителей
    total_units: int | None = None
    completed_units: int | None = None


# backend/schemas.py


class CourseReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(
        ..., min_length=50, max_length=2000
    )  # 🔥 Минимум 50 символов (не слов, но можно увеличить)


class CourseReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    username: str
    avatar_url: str | None = None
    rating: int
    comment: str
    created_at: datetime


class CourseReviewsResponse(BaseModel):
    reviews: list[CourseReviewOut]
    stats: dict  # { average_rating, total_reviews, user_review }


class EgeLessonList(BaseModel):
    subject_slug: str
    lessons: list[EgeLessonOut]


class TestQuestionCreate(BaseModel):
    question_text: str
    correct_answer: str
    order_index: int = 0


class CourseLessonsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    lessons: list[EgeLessonOut]
    units: list[CourseUnitOut]
    is_enrolled: bool


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


class EgeTestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lesson_id: int
    title: str
    passing_score: int
    questions: list[TestQuestionOut] = []


class TestSubmissionResult(BaseModel):
    score: float
    passed: bool
    total_questions: int
    correct_count: int

    reward_granted: bool = False  # 🔥 Добавь это поле


class TestSubmission(BaseModel):
    answers: dict[str, str]


class TestResultCreate(BaseModel):
    score: int = Field(..., ge=0, le=100)
    passed: bool


class TestResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    score: int
    passed: bool
    reward_granted: bool = False  # 🔥 Добавь это поле!
    completed_at: datetime


class LessonViewCreate(BaseModel):
    pass


class LessonViewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    viewed_at: datetime


class ReactionCreate(BaseModel):
    reaction_type: str


class LessonStatsOut(BaseModel):
    likes: int
    dislikes: int
    user_reaction: str | None = None


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
    reaction_type: str


class ArticleStatsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    likes: int
    dislikes: int
    views: int
    user_reaction: str | None = None


class CommentReactionCreate(BaseModel):
    reaction_type: str


class PublicProfileOut(BaseModel):
    """Публичный профиль"""

    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    avatar_url: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    status: str | None = None
    about_me: str | None = None
    created_at: str | None = None  # 🔥 Добавляем дату регистрации
    token_balance: int = 0
    completed_courses: list[dict] = []


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
    likes: int = 0
    dislikes: int = 0
    user_reaction: str | None = None
    replies: list["CommentWithStatsOut"] = []


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: int | None = None
    lesson_id: int | None = None
    article_id: int | None = None


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    username: str
    content: str
    avatar_url: str | None = None
    parent_id: int | None
    created_at: datetime
    replies: list["CommentOut"] = []


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


class FlashcardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    front: str
    back: str
    hint: str | None = None
    example: str | None = None
    user_progress: dict | None = (
        None  # { next_review, interval_days, ease_factor, repetitions }
    )


# backend/schemas.py


class FavoriteCourseItem(BaseModel):
    """Элемент избранного курса"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    course_title: str
    course_slug: str
    course_cover: str | None = None
    created_at: datetime


class FlashcardDeckOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None = None
    lesson_id: int
    card_count: int = 0
    cards: list[FlashcardOut] = []
    due_count: int = 0  # Сколько карточек нужно повторить сегодня
    new_count: int = 0  # Сколько новых карточек
    mastered_count: int = 0  # Сколько выучено


class FlashcardAnswer(BaseModel):
    card_id: int
    rating: str  # "again" | "hard" | "good" | "easy" (как в Anki)


__all__ = [
    "TokenReward",
    "PublicProfileOut",
    "PromoCourseOut",
    "ReviewOut",
    "ReviewStatsOut",
    "ReviewCreate",
    "ReviewUpdate",
    "UserRegister",
    "UserLogin",
    "UserOut",
    "FavoriteCourseItem",
    "Token",
    "CourseReviewCreate",
    "CourseReviewOut",
    "CourseReviewsResponse",
    "EgeSubjectCreate",
    "EgeSubjectOut",
    "EgeLessonCreate",
    "COurseLessonsResponse",
    "TeacherOut",
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
    "FlashcardOut",
    "FlashcardDeckOut",
    "FlashcardAnswer",
]
