# backend/schemas.py

from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional, List, Literal

# === Схемы для аутентификации ===


class UserRegister(BaseModel):
    """Схема для регистрации и логина"""

    email: EmailStr
    password: str = Field(..., min_length=6)
    username: str = Field(..., min_length=3)


class UserResponse(BaseModel):
    """Ответ после регистрации/логина"""

    message: Optional[str] = None
    email: str
    username: str

    class Config:
        from_attributes = True


# backend/schemas.py

# backend/schemas.py


class LessonViewCreate(BaseModel):
    """Запрос на запись просмотра"""

    lesson_id: int
    user_id: Optional[int] = None  # Для анонимов
    session_id: Optional[str] = None  # Для отслеживания анонимных сессий


class LessonViewResponse(BaseModel):
    """Ответ с данными о просмотре"""

    view_count: int
    is_new_view: bool  # Был ли это новый просмотр

    class Config:
        from_attributes = True


class LessonFeedbackCreate(BaseModel):
    """Запрос на добавление фидбека"""

    feedback_type: Literal["clear", "unclear"]  # Только эти два значения


class LessonFeedbackResponse(BaseModel):
    """Ответ с фидбеком пользователя"""

    feedback_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class LessonFeedbackCounts(BaseModel):
    """Ответ с подсчётом реакций"""

    clear_count: int
    unclear_count: int
    user_feedback: Optional[str] = None  # "clear", "unclear" или null

    class Config:
        from_attributes = True


# === Схемы для статей ===
# backend/schemas.py

# backend/schemas.py
# backend/schemas.py


class CategoryCreate(BaseModel):
    """Схема для создания категории"""

    slug: str = Field(..., min_length=3, pattern=r"^[a-z-]+$")
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    order_number: Optional[int] = 0
    is_published: Optional[bool] = True


# backend/schemas.py
# backend/schemas.py


class QuestionCreate(BaseModel):
    """Схема для создания вопроса"""

    question_text: str = Field(..., min_length=10)
    question_type: Optional[str] = "multiple_choice"
    answer_type: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str = Field(..., min_length=1)
    explanation: Optional[str] = None
    order_number: Optional[int] = 0


class QuestionResponse(BaseModel):
    """Ответ с данными вопроса (без correct_answer!)"""

    id: int
    question_text: str
    question_type: str
    answer_type: Optional[str]
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    # ❌ correct_answer НЕ возвращаем клиенту!
    explanation: Optional[str]
    order_number: int

    class Config:
        from_attributes = True


class TestCreate(BaseModel):
    """Схема для создания теста"""

    title: str = Field(..., min_length=3)
    description: Optional[str] = None
    passing_score: Optional[int] = 70
    time_limit_minutes: Optional[int] = None
    is_published: Optional[bool] = True
    questions: Optional[List[QuestionCreate]] = []


class TestResponse(BaseModel):
    """Ответ с данными теста (для клиента — без правильных ответов)"""

    id: int
    title: str
    description: Optional[str]
    passing_score: int
    time_limit_minutes: Optional[int]
    questions: List[QuestionResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class TestSubmitRequest(BaseModel):
    """Запрос на проверку теста"""

    answers: dict[int, str]  # ✅ Встроенный dict (Python 3.9+)


class TestResultResponse(BaseModel):
    """Результат прохождения теста"""

    score: int
    passed: bool
    total_questions: int
    correct_answers: int
    feedback: Optional[str] = None


class TestFullResponse(BaseModel):
    """Полный ответ для админки (с correct_answer)"""

    id: int
    title: str
    description: Optional[str]
    passing_score: int
    time_limit_minutes: Optional[int]
    questions: List[QuestionResponse]  # Всё равно без correct_answer для безопасности
    created_at: datetime

    class Config:
        from_attributes = True


class LanguageLessonCreate(BaseModel):
    """Схема для создания урока языка"""

    slug: str = Field(..., min_length=3, pattern=r"^[a-z-]+$")
    title: str = Field(..., min_length=2)
    description: Optional[str] = None
    content: Optional[str] = None
    estimated_minutes: Optional[int] = 10
    order_number: Optional[int] = 0
    is_published: Optional[bool] = True


class LanguageLessonResponse(BaseModel):
    """Ответ с данными урока"""

    id: int
    slug: str
    title: str
    description: Optional[str]
    content: Optional[str]
    estimated_minutes: int
    order_number: Optional[int] = None
    language_id: int
    level_id: int
    category_id: int
    is_published: bool
    created_at: datetime
    view_count: int = 0  # Заглушка
    test_id: Optional[int] = None
    lesson_type: str = "language"

    class Config:
        from_attributes = True


class LanguageLessonListResponse(BaseModel):
    """Ответ со списком уроков"""

    lessons: List[LanguageLessonResponse]
    total: int


class CategoryResponse(BaseModel):
    """Ответ с данными категории"""

    id: int
    slug: str
    name: str
    description: Optional[str]
    order_number: int
    language_id: int
    level_id: int
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryListResponse(BaseModel):
    """Ответ со списком категорий"""

    categories: List[CategoryResponse]
    total: int


class LevelCreate(BaseModel):
    """Схема для создания уровня"""

    code: str = Field(..., pattern=r"^(A1|A2|B1|B2|C1|C2)$")  # CEFR levels
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    display_order: Optional[int] = 0
    is_published: Optional[bool] = True


class LevelResponse(BaseModel):
    """Ответ с данными уровня"""

    id: int
    code: str
    name: str
    description: Optional[str]
    display_order: int
    language_id: int
    is_published: bool
    created_at: datetime
    categories_count: int = 0  # Заглушка для количества категорий

    class Config:
        from_attributes = True


class LevelListResponse(BaseModel):
    """Ответ со списком уровней"""

    levels: List[LevelResponse]
    total: int


class LanguageCreate(BaseModel):
    """Схема для создания языка"""

    slug: str = Field(..., min_length=3, pattern=r"^[a-z-]+$")
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = "/language-placeholder.png"
    is_active: Optional[bool] = True


class LanguageResponse(BaseModel):
    """Ответ с данными языка"""

    id: int
    slug: str
    name: str
    description: Optional[str]
    icon: Optional[str]
    image: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LanguageListResponse(BaseModel):
    """Ответ со списком языков"""

    languages: List[LanguageResponse]
    total: int


class ArticleCreate(BaseModel):
    """Схема для создания статьи"""

    slug: str = Field(..., min_length=3, pattern=r"^[a-z0-9-]+$")
    name: str = Field(..., min_length=3)
    category: Optional[str] = "Общее"
    time: Optional[str] = "5 мин"
    text: str = Field(..., min_length=10)
    image: Optional[str] = None

    @field_validator("slug")
    @classmethod
    def slug_must_be_lowercase(cls, v: str) -> str:
        return v.lower().replace(" ", "-")


class ArticleResponse(BaseModel):
    """Ответ с данными статьи"""

    id: int
    slug: str
    name: str
    category: str
    time: str
    text: str
    image: Optional[str]
    created_at: datetime
    view_count: int = 0

    class Config:
        from_attributes = True


# backend/schemas.py

# backend/schemas.py

# backend/schemas.py


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

    class Config:
        from_attributes = True


class LessonCreate(BaseModel):
    """Схема для создания урока"""

    slug: str = Field(..., min_length=3, pattern=r"^[a-z0-9-]+$")
    title: str = Field(..., min_length=3)
    description: Optional[str] = None
    estimated_minutes: Optional[int] = 30
    content: Optional[str] = None
    order_number: Optional[int] = 0
    is_published: Optional[bool] = True


class LessonResponse(BaseModel):
    """Ответ с данными урока"""

    id: int
    slug: str
    title: str
    description: Optional[str]
    estimated_minutes: Optional[int]
    content: Optional[str]
    course_id: int
    order_number: Optional[int] = None
    is_published: bool
    created_at: datetime
    view_count: int = 0  # Пока заглушка
    test_id: Optional[int] = None
    lesson_type: str = "ege"

    class Config:
        from_attributes = True


class LessonListResponse(BaseModel):
    """Ответ со списком уроков"""

    lessons: List[LessonResponse]
    total: int


class CourseCreate(BaseModel):
    """Схема для создания курса"""

    slug: str = Field(..., min_length=3, pattern=r"^[a-z0-9-]+$")
    name: str = Field(..., min_length=3)
    subject: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = "/course-placeholder.png"
    is_published: Optional[bool] = True


class CourseResponse(BaseModel):
    """Ответ с данными курса"""

    id: int
    slug: str
    name: str
    subject: Optional[str]
    description: Optional[str]
    image: str
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    """Ответ со списком курсов"""

    courses: List[CourseResponse]
    total: int


class ArticleListResponse(BaseModel):
    """Ответ со списком статей"""

    articles: List[ArticleResponse]
    total: int


# === Вспомогательные схемы ===


class ErrorResponse(BaseModel):
    """Стандартный ответ об ошибке"""

    detail: str


class Token(BaseModel):
    """JWT токен"""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Данные из токена"""

    email: Optional[str] = None
    username: Optional[str] = None
