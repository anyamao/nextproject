from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime


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


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


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


# 📤 Ответ: урок
class EgeLessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    subject_id: int
    title: str
    slug: str
    description: str | None
    content: str | None
    time_minutes: int | None
    test_id: int | None
    created_at: datetime
    updated_at: datetime | None


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


# конец #######################################################


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
]
