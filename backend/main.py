# backend/main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, and_, not_, or_
from datetime import timedelta
from pydantic import BaseModel, EmailStr, Field
import uvicorn
from sqlalchemy.orm import relationship
import os
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Request

# 🔁 Импорты из твоих файлов
from database import engine, Base, get_db, init_db
from models import (
    User,
    Article,
    Course,
    Lesson,
    Language,
    Level,
    Category,
    LanguageLesson,
    Test,
    Question,
    TestResult,
    LessonFeedback,
    LessonView,
)
from schemas import (
    UserRegister,
    TokenResponse,
    UserResponse,
    ArticleCreate,
    ArticleResponse,
    ArticleListResponse,
    CourseCreate,
    CourseResponse,
    CourseListResponse,
    LessonCreate,
    LessonResponse,
    LessonListResponse,
    LanguageCreate,
    LanguageResponse,
    LanguageListResponse,
    LevelCreate,
    LevelResponse,
    LevelListResponse,
    CategoryCreate,
    CategoryResponse,
    CategoryListResponse,
    LanguageLessonCreate,
    LanguageLessonResponse,
    LanguageLessonListResponse,
    QuestionCreate,
    QuestionResponse,
    TestCreate,
    TestResponse,
    TestSubmitRequest,
    TestResultResponse,
    TestFullResponse,
    LessonFeedbackCreate,
    LessonFeedbackCounts,
    LessonViewResponse,
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)  # ✅ Добавили get_current_user!

app = FastAPI(title="Maoschool API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3010",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "https://maoschool.ru",  # ✅ Должна быть эта строка!
        "https://www.maoschool.ru",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === Эндпоинты для ЕГЭ ===
# backend/main.py


# backend/main.py — найди startup_event и замени на этот код:


# backend/main.py


@app.on_event("startup")
async def startup_event():
    from database import init_db, IS_ALEMBIC, IS_SQLITE

    # 🔁 Создаём таблицы только для SQLite в dev (не для Alembic и не для prod)
    if IS_SQLITE and not IS_ALEMBIC:
        # 🔁 init_db() уже знает, какой движок использовать
        if hasattr(init_db, "__await__"):  # Если async функция
            init_db()
        else:  # Если sync функция
            init_db()
        print("✅ SQLite tables created (dev only)")
    else:
        print("✅ Using PostgreSQL or Alembic context — migrations handled separately")


# Список предметов ЕГЭ (фильтруем курсы по полю subject)
EGE_SUBJECTS = ["Физика", "Русский язык", "Математика", "Информатика"]


# === Фидбек для уроков ===


@app.get("/api/lessons/{lesson_id}/feedback", response_model=LessonFeedbackCounts)
async def get_lesson_feedback(
    lesson_id: int,
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 🕵️ Определяем тип урока
    lang_lesson =  db.get(LanguageLesson, lesson_id)
    lesson_type = "language" if lang_lesson else "ege"

    clear_result =  db.execute(
        select(func.count(LessonFeedback.id)).where(
            LessonFeedback.lesson_id == lesson_id,
            LessonFeedback.feedback_type == "clear",
            LessonFeedback.lesson_type == lesson_type,  # ✅ Фильтр по типу
        )
    )
    clear_count = clear_result.scalar() or 0

    unclear_result =  db.execute(
        select(func.count(LessonFeedback.id)).where(
            LessonFeedback.lesson_id == lesson_id,
            LessonFeedback.feedback_type == "unclear",
            LessonFeedback.lesson_type == lesson_type,  # ✅ Фильтр по типу
        )
    )
    unclear_count = unclear_result.scalar() or 0

    user_feedback = None
    if current_user:
        result =  db.execute(
            select(LessonFeedback.feedback_type).where(
                LessonFeedback.lesson_id == lesson_id,
                LessonFeedback.user_id == current_user.id,
                LessonFeedback.lesson_type == lesson_type,  # ✅ Фильтр по типу
            )
        )
        user_feedback = result.scalar_one_or_none()

    return LessonFeedbackCounts(
        clear_count=clear_count,
        unclear_count=unclear_count,
        user_feedback=user_feedback,
    )


@app.get("/api/ege/subjects", response_model=CourseListResponse)
async def get_ege_subjects(db: AsyncSession = Depends(get_db)):
    result =  db.execute(
        select(Course)
        .where(Course.subject.in_(EGE_SUBJECTS), Course.is_published == True)
        .order_by(Course.name)
    )
    courses = result.scalars().all()

    return CourseListResponse(
        courses=[
            CourseResponse(
                id=c.id,
                slug=c.slug,
                name=c.name,
                subject=c.subject,
                description=c.description,
                image=c.image,
                is_published=c.is_published,
                created_at=c.created_at,
            )
            for c in courses
        ],
        total=len(courses),
    )


# ✨ Создать 4 тестовых ЕГЭ-курса (только для dev!)
#
#
## === Эндпоинты для страниц предметов ЕГЭ ===
# === Эндпоинты для категорий уровня ===
# === Эндпоинты для тестов ===
@app.post("/api/lessons/{lesson_id}/view", response_model=LessonViewResponse)
async def record_lesson_view(
    lesson_id: int,
    request: Request,
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session_id = request.headers.get("X-Session-ID")

    # 🕵️ Определяем тип урока
    lang_lesson =  db.get(LanguageLesson, lesson_id)
    lesson_type = "language" if lang_lesson else "ege"
    target_model = LanguageLesson if lang_lesson else Lesson

    # Проверка уникального просмотра
    if current_user:
        view_query = select(LessonView).where(
            LessonView.lesson_id == lesson_id,
            LessonView.user_id == current_user.id,
            LessonView.lesson_type == lesson_type,  # ✅ Фильтр
        )
    elif session_id:
        view_query = select(LessonView).where(
            LessonView.lesson_id == lesson_id,
            LessonView.session_id == session_id,
            LessonView.lesson_type == lesson_type,  # ✅ Фильтр
        )
    else:
        return LessonViewResponse(view_count=0, is_new_view=False)

    existing_view =  db.execute(view_query)
    existing = existing_view.scalar_one_or_none()
    is_new_view = existing is None

    if is_new_view:
        new_view = LessonView(
            lesson_id=lesson_id,
            user_id=current_user.id if current_user else None,
            session_id=session_id if not current_user else None,
            lesson_type=lesson_type,  # ✅ Сохраняем тип
        )
        db.add(new_view)

        db.execute(
            update(target_model)
            .where(target_model.id == lesson_id)
            .values(view_count=target_model.view_count + 1)
        )
        db.commit()

    result =  db.execute(
        select(target_model.view_count).where(target_model.id == lesson_id)
    )
    count = result.scalar() or 0

    return LessonViewResponse(view_count=count, is_new_view=is_new_view)


async def get_languages(db: AsyncSession = Depends(get_db)):
    result = db.execute(
        select(Language).where(Language.is_active == True).order_by(Language.name)
    )
    languages = result.scalars().all()
    return LanguageListResponse(
        languages=[
            LanguageResponse(
                id=l.id,
                slug=l.slug,
                name=l.name,
                description=l.description,
                icon=l.icon,
                image=l.image,
                is_active=l.is_active,
                created_at=l.created_at,
            )
            for l in languages
        ],
        total=len(languages),
    )

@app.post("/api/languages/seed", status_code=201)
async def seed_language(db: AsyncSession = Depends(get_db)):
    # Проверяем, нет ли уже английского (без await для sync!)
    result = db.execute(select(Language).where(Language.slug == "english"))
    if result.scalar_one_or_none():
        return {"message": "English already exists"}
    
    # Создаём язык (без пробелов в строках!)
    english = Language(
        slug="english",
        name="Английский",
        description="Полный курс от A1 до C1: грамматика, лексика, аудирование, говорение",
        icon="🇬🇧",
        image="/english-flag.png",
        is_active=True,
    )
    
    db.add(english)
    db.commit()  # ✅ Sync: без await!
    
    return {"message": "English language created", "slug": english.slug}
# 📝 Получить тест для урока языка
@app.get(
    "/api/languages/{language_slug}/levels/{level_code}/categories/{category_slug}/lessons/{lesson_slug}/test",
    response_model=TestResponse,
)
async def get_lesson_test(
    language_slug: str,
    level_code: str,
    category_slug: str,
    lesson_slug: str,
    db: AsyncSession = Depends(get_db),
):
    # Находим урок (аналогично эндпоинту урока)
    lang_result =  db.execute(
        select(Language).where(Language.slug == language_slug)
    )
    language = lang_result.scalar_one_or_none()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    level_result =  db.execute(
        select(Level).where(
            Level.language_id == language.id, Level.code == level_code.upper()
        )
    )
    level = level_result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    cat_result =  db.execute(
        select(Category).where(
            Category.language_id == language.id,
            Category.level_id == level.id,
            Category.slug == category_slug,
        )
    )
    category = cat_result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    lesson_result =  db.execute(
        select(LanguageLesson).where(
            LanguageLesson.language_id == language.id,
            LanguageLesson.level_id == level.id,
            LanguageLesson.category_id == category.id,
            LanguageLesson.slug == lesson_slug,
        )
    )
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Находим тест для этого урока
    test_result =  db.execute(
        select(Test).where(Test.lesson_id == lesson.id, Test.is_published == True)
    )
    test = test_result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found for this lesson")

    # Получаем вопросы (без correct_answer!)
    questions_result =  db.execute(
        select(Question)
        .where(Question.test_id == test.id)
        .order_by(Question.order_number)
    )
    questions = questions_result.scalars().all()

    return TestResponse(
        id=test.id,
        title=test.title,
        description=test.description,
        passing_score=test.passing_score,
        time_limit_minutes=test.time_limit_minutes,
        questions=[
            QuestionResponse(
                id=q.id,
                question_text=q.question_text,
                question_type=q.question_type,
                answer_type=q.answer_type,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                explanation=q.explanation,
                order_number=q.order_number,
            )
            for q in questions
        ],
        created_at=test.created_at,
    )


@app.post("/auth/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),  # ✅ Правильное имя: form_data
    db: AsyncSession = Depends(get_db),
):
    # 🔁 Ищем пользователя по email (OAuth2 использует поле "username")
    result =  db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        {"sub": user.email},  # ✅ Позиционный аргумент (без data=)
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(email=user.email, username=user.username),
    )


async def seed_math_test(
    request_data: dict,  # ✅ FastAPI автоматически распарсит JSON
    db: AsyncSession = Depends(get_db),  # ✅ Добавляем зависимость БД
):
    lesson_slug = request_data.get("lesson_slug")
    course_slug = request_data.get("course_slug")

    # Находим курс
    course_result =  db.execute(select(Course).where(Course.slug == course_slug))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Находим урок
    lesson_result =  db.execute(
        select(Lesson).where(Lesson.slug == lesson_slug, Lesson.course_id == course.id)
    )
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Проверяем, нет ли уже теста
    existing_test =  db.execute(select(Test).where(Test.lesson_id == lesson.id))
    if existing_test.scalar_one_or_none():
        return {"message": "Test already exists for this lesson"}

    # Создаём тест
    test = Test(
        title=request_data.get("title", "Тест"),
        description=request_data.get("description"),
        lesson_id=lesson.id,
        passing_score=request_data.get("passing_score", 70),
        time_limit_minutes=request_data.get("time_limit_minutes"),
        is_published=True,
    )
    db.add(test)
    db.flush()  # Чтобы получить test.id

    # Добавляем вопросы
    for q_data in request_data.get("questions", []):  # ✅ Используем q_data
        question = Question(
            test_id=test.id,
            question_text=q_data["question_text"],
            question_type=q_data.get("question_type", "multiple_choice"),
            answer_type=q_data.get("answer_type"),
            option_a=q_data.get("option_a"),
            option_b=q_data.get("option_b"),
            option_c=q_data.get("option_c"),
            option_d=q_data.get("option_d"),
            correct_answer=q_data["correct_answer"],
            explanation=q_data.get("explanation"),
            order_number=q_data.get("order_number", 0),
        )
        db.add(question)

    db.commit()

    # Обновляем урок с test_id
    lesson.test_id = test.id
    db.commit()

    return {"message": "Test created", "test_id": test.id, "lesson_slug": lesson_slug}


# === Получить лучший результат пользователя для теста ===
@app.get("/api/tests/{test_id}/result", response_model=TestResultResponse)
async def get_test_result(
    test_id: int,
    current_user: User = Depends(get_current_user),  # 🔐 Только авторизованные
    db: AsyncSession = Depends(get_db),
):
    # Находим лучший результат пользователя для этого теста
    result =  db.execute(
        select(TestResult)
        .where(TestResult.test_id == test_id, TestResult.user_id == current_user.id)
        .order_by(TestResult.score.desc())  # 🔁 Сортируем по убыванию — берём лучший
        .limit(1)
    )
    test_result = result.scalar_one_or_none()

    if not test_result:
        # Если результатов нет — возвращаем заглушку
        return TestResultResponse(
            score=0,
            passed=False,
            total_questions=0,
            correct_answers=0,
            feedback="Тест ещё не пройден",
        )

    return TestResultResponse(
        score=test_result.score,
        passed=test_result.passed,
        total_questions=0,  # Можно добавить, если нужно
        correct_answers=0,
        feedback="Отлично!" if test_result.passed else "Попробуйте ещё раз",
    )


# === Получить тест по ID (для фронтенда) ===
@app.get("/api/tests/{test_id}", response_model=TestResponse)
async def get_test_by_id(test_id: int, db: AsyncSession = Depends(get_db)):
    # Находим тест
    test_result =  db.execute(
        select(Test).where(Test.id == test_id, Test.is_published == True)
    )
    test = test_result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Получаем вопросы (без correct_answer!)
    questions_result =  db.execute(
        select(Question)
        .where(Question.test_id == test_id)
        .order_by(Question.order_number)
    )
    questions = questions_result.scalars().all()

    return TestResponse(
        id=test.id,
        title=test.title,
        description=test.description,
        passing_score=test.passing_score,
        time_limit_minutes=test.time_limit_minutes,
        questions=[
            QuestionResponse(
                id=q.id,
                question_text=q.question_text,
                question_type=q.question_type,
                answer_type=q.answer_type,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                explanation=q.explanation,
                order_number=q.order_number,
            )
            for q in questions
        ],
        created_at=test.created_at,
    )


@app.post("/api/lessons/{lesson_id}/feedback", status_code=201)
async def submit_lesson_feedback(
    lesson_id: int,
    feedback_data: LessonFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 🕵️ Определяем тип урока
    lang_lesson =  db.get(LanguageLesson, lesson_id)
    lesson_type = "language" if lang_lesson else "ege"

    existing =  db.execute(
        select(LessonFeedback).where(
            LessonFeedback.lesson_id == lesson_id,
            LessonFeedback.user_id == current_user.id,
            LessonFeedback.lesson_type == lesson_type,  # ✅ Фильтр по типу
        )
    )
    existing_feedback = existing.scalar_one_or_none()

    if existing_feedback:
        existing_feedback.feedback_type = feedback_data.feedback_type
    else:
        new_feedback = LessonFeedback(
            lesson_id=lesson_id,
            user_id=current_user.id,
            feedback_type=feedback_data.feedback_type,
            lesson_type=lesson_type,  # ✅ Сохраняем тип
        )
        db.add(new_feedback)

    db.commit()
    return get_lesson_feedback(lesson_id, current_user, db)


# ✅ Проверка ответов теста
@app.post("/api/tests/{test_id}/submit", response_model=TestResultResponse)
async def submit_test(
    test_id: int,
    submission: TestSubmitRequest,
    current_user: User = Depends(get_current_user),  # 🔐 Только авторизованные
    db: AsyncSession = Depends(get_db),
):
    # Находим тест
    test =  db.get(Test, test_id)
    if not test or not test.is_published:
        raise HTTPException(status_code=404, detail="Test not found")

    # Получаем правильные ответы (только на сервере!)
    questions_result =  db.execute(
        select(Question).where(Question.test_id == test_id)
    )
    questions = questions_result.scalars().all()

    # Проверяем ответы
    correct_count = 0
    for q in questions:
        user_answer = submission.answers.get(q.id, "").strip().lower()
        correct = q.correct_answer.strip().lower()

        # Для числовых ответов — сравниваем с допуском
        if q.answer_type == "decimal" or q.answer_type == "number":
            try:
                if abs(float(user_answer) - float(correct)) < 0.01:
                    correct_count += 1
            except:
                pass
        elif user_answer == correct:
            correct_count += 1

    score = round((correct_count / len(questions)) * 100) if questions else 0
    passed = score >= test.passing_score

    # Сохраняем результат
    result = TestResult(
        test_id=test_id,
        user_id=current_user.id,
        score=score,
        passed=passed,
        answers=submission.answers,
    )
    db.add(result)
    db.commit()

    return TestResultResponse(
        score=score,
        passed=passed,
        total_questions=len(questions),
        correct_answers=correct_count,
        feedback="Отлично!" if passed else "Попробуйте ещё раз",
    )


# ✅ Оставь этот:
# ✨ Создать тестовый тест для урока "Hello & Goodbye" (только для dev!)
# ✅ ОСТАВЬ ЭТОТ (где-то после строки ~1000):
@app.get("/api/languages", response_model=LanguageListResponse)
async def get_languages(db: AsyncSession = Depends(get_db)):
    result = db.execute(
        select(Language).where(Language.is_active == True).order_by(Language.name)
    )
    languages = result.scalars().all()
    return LanguageListResponse(
        languages=[
            LanguageResponse(
                id=l.id,
                slug=l.slug,
                name=l.name,
                description=l.description,
                icon=l.icon,
                image=l.image,
                is_active=l.is_active,
                created_at=l.created_at,
            )
            for l in languages
        ],
        total=len(languages),
    )


# 📚 Получить все категории для уровня языка
@app.get(
    "/api/languages/{language_slug}/levels/{level_code}/categories",
    response_model=CategoryListResponse,
)
async def get_level_categories(
    language_slug: str, level_code: str, db: AsyncSession = Depends(get_db)
):
    # Находим язык
    lang_result =  db.execute(
        select(Language).where(
            Language.slug == language_slug, Language.is_active == True
        )
    )
    language = lang_result.scalar_one_or_none()

    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    # Находим уровень по коду (A2, B1, etc.)
    level_result =  db.execute(
        select(Level).where(
            Level.language_id == language.id,
            Level.code == level_code.upper(),
            Level.is_published == True,
        )
    )
    level = level_result.scalar_one_or_none()

    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    # Получаем категории
    result =  db.execute(
        select(Category)
        .where(
            Category.language_id == language.id,
            Category.level_id == level.id,
            Category.is_published == True,
        )
        .order_by(Category.order_number)
    )
    categories = result.scalars().all()

    return CategoryListResponse(
        categories=[
            CategoryResponse(
                id=c.id,
                slug=c.slug,
                name=c.name,
                description=c.description,
                order_number=c.order_number,
                language_id=c.language_id,
                level_id=c.level_id,
                is_published=c.is_published,
                created_at=c.created_at,
            )
            for c in categories
        ],
        total=len(categories),
    )


# === Эндпоинты для уроков категории ===


# 📚 Получить все уроки для категории
@app.get(
    "/api/languages/{language_slug}/levels/{level_code}/categories/{category_slug}/lessons",
    response_model=LanguageLessonListResponse,
)
async def get_category_lessons(
    language_slug: str,
    level_code: str,
    category_slug: str,
    db: AsyncSession = Depends(get_db),
):
    # Находим язык
    lang_result =  db.execute(
        select(Language).where(
            Language.slug == language_slug, Language.is_active == True
        )
    )
    language = lang_result.scalar_one_or_none()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    # Находим уровень
    level_result =  db.execute(
        select(Level).where(
            Level.language_id == language.id,
            Level.code == level_code.upper(),
            Level.is_published == True,
        )
    )
    level = level_result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    # Находим категорию
    cat_result =  db.execute(
        select(Category).where(
            Category.language_id == language.id,
            Category.level_id == level.id,
            Category.slug == category_slug,
            Category.is_published == True,
        )
    )
    category = cat_result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Получаем уроки
    result =  db.execute(
        select(LanguageLesson)
        .where(
            LanguageLesson.language_id == language.id,
            LanguageLesson.level_id == level.id,
            LanguageLesson.category_id == category.id,
            LanguageLesson.is_published == True,
        )
        .order_by(LanguageLesson.order_number)
    )
    lessons = result.scalars().all()

    # ✅ ИСПРАВЛЕНО: заменили 'l' на 'lesson' и исправили view_count
    return LanguageLessonListResponse(
        lessons=[
            LanguageLessonResponse(
                id=lesson.id,
                slug=lesson.slug,
                title=lesson.title,
                description=lesson.description,
                content=lesson.content,
                estimated_minutes=lesson.estimated_minutes,
                order_number=lesson.order_number,
                language_id=lesson.language_id,
                level_id=lesson.level_id,
                category_id=lesson.category_id,
                is_published=lesson.is_published,
                created_at=lesson.created_at,
                view_count=lesson.view_count or 0,  # ✅ Теперь работает без ошибок
            )
            for lesson in lessons  # ✅ Понятное имя переменной
        ],
        total=len(lessons),
    )


# ✨ Создать тестовый урок (только для dev!)


# === Получить один урок языка по slug ===


@app.get(
    "/api/languages/{language_slug}/levels/{level_code}/categories/{category_slug}/lessons/{lesson_slug}",
    response_model=LanguageLessonResponse,
)
async def get_language_lesson(
    language_slug: str,
    level_code: str,
    category_slug: str,
    lesson_slug: str,
    db: AsyncSession = Depends(get_db),
):
    # Находим язык
    lang_result = db.execute(
        select(Language).where(
            Language.slug == language_slug, Language.is_active == True
        )
    )
    language = lang_result.scalar_one_or_none()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    # Находим уровень
    level_result =  db.execute(
        select(Level).where(
            Level.language_id == language.id,
            Level.code == level_code.upper(),
            Level.is_published == True,
        )
    )
    level = level_result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    # Находим категорию
    cat_result =  db.execute(
        select(Category).where(
            Category.language_id == language.id,
            Category.level_id == level.id,
            Category.slug == category_slug,
            Category.is_published == True,
        )
    )
    category = cat_result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Находим урок
    lesson_result =  db.execute(
        select(LanguageLesson).where(
            LanguageLesson.language_id == language.id,
            LanguageLesson.level_id == level.id,
            LanguageLesson.category_id == category.id,
            LanguageLesson.slug == lesson_slug,
            LanguageLesson.is_published == True,
        )
    )
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # ✅ ИСПРАВЛЕНО: возвращаем реальное view_count из БД
    return LanguageLessonResponse(
        id=lesson.id,
        slug=lesson.slug,
        title=lesson.title,
        description=lesson.description,
        content=lesson.content,
        estimated_minutes=lesson.estimated_minutes,
        order_number=lesson.order_number,
        language_id=lesson.language_id,
        level_id=lesson.level_id,
        category_id=lesson.category_id,
        is_published=lesson.is_published,
        created_at=lesson.created_at,
        view_count=lesson.view_count or 0,  # <--- ВОТ ЭТО ИЗМЕНИЛОСЬ
    )


# ✨ Создать тестовую категорию для английского A2 (только для dev!)
@app.post(
    "/api/languages/{language_slug}/levels/{level_code}/categories/seed",
    status_code=201,
)
async def seed_category(
    language_slug: str,
    level_code: str,
    category_data: CategoryCreate,  # Pydantic: slug, name, description, order_number
    db: AsyncSession = Depends(get_db),
):
    """🌱 Generic endpoint to seed ANY category (dev only)"""
    if os.getenv("DEBUG", "False").lower() != "true":
        raise HTTPException(status_code=403, detail="Only available in development")

    # Find language
    lang_result =  db.execute(
        select(Language).where(Language.slug == language_slug)
    )
    language = lang_result.scalar_one_or_none()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    # Find level
    level_result =  db.execute(
        select(Level).where(
            Level.language_id == language.id,
            Level.code == level_code.upper(),  # "a2" → "A2"
        )
    )
    level = level_result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    # Check if category already exists
    existing =  db.execute(
        select(Category).where(
            Category.slug == category_data.slug.strip(),
            Category.level_id == level.id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Category already exists", "slug": category_data.slug}

    # Create new category
    new_category = Category(
        slug=category_data.slug.strip(),
        name=category_data.name.strip(),
        description=category_data.description,
        order_number=category_data.order_number or 99,
        language_id=language.id,
        level_id=level.id,
        is_published=True,
    )

    db.add(new_category)
    db.commit()

    return {
        "message": "Category created",
        "slug": new_category.slug,
        "id": new_category.id,
        "name": new_category.name,
    }


@app.post(
    "/api/languages/{language_slug}/levels/{level_code}/categories/{category_slug}/lessons/seed",
    status_code=201,
)
async def seed_lesson(
    language_slug: str,
    level_code: str,
    category_slug: str,
    lesson_data: LanguageLessonCreate,  # Pydantic: slug, title, content, etc.
    db: AsyncSession = Depends(get_db),
):
    """🌱 Generic endpoint to seed ANY lesson (dev only)"""
    if os.getenv("DEBUG", "False").lower() != "true":
        raise HTTPException(status_code=403, detail="Only available in development")

    # Find language → level → category (same pattern as above)
    lang_result =  db.execute(
        select(Language).where(Language.slug == language_slug)
    )
    language = lang_result.scalar_one_or_none()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    level_result =  db.execute(
        select(Level).where(
            Level.language_id == language.id,
            Level.code == level_code.upper(),
        )
    )
    level = level_result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    cat_result =  db.execute(
        select(Category).where(
            Category.language_id == language.id,
            Category.level_id == level.id,
            Category.slug == category_slug.strip(),
        )
    )
    category = cat_result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if lesson already exists
    existing =  db.execute(
        select(LanguageLesson).where(
            LanguageLesson.slug == lesson_data.slug.strip(),
            LanguageLesson.category_id == category.id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Lesson already exists", "slug": lesson_data.slug}

    # Create new lesson
    new_lesson = LanguageLesson(
        slug=lesson_data.slug.strip(),
        title=lesson_data.title.strip(),
        description=lesson_data.description,
        content=lesson_data.content,
        estimated_minutes=lesson_data.estimated_minutes or 15,
        order_number=lesson_data.order_number or 99,
        language_id=language.id,
        level_id=level.id,
        category_id=category.id,
        is_published=True,
    )

    db.add(new_lesson)
    db.commit()

    return {
        "message": "Lesson created",
        "slug": new_lesson.slug,
        "id": new_lesson.id,
        "title": new_lesson.title,
    }


# Получить уроки по предмету (slug предмета = slug курса)
@app.get("/api/ege/{subject_slug}/lessons", response_model=LessonListResponse)
async def get_ege_lessons(subject_slug: str, db: AsyncSession = Depends(get_db)):
    # Находим курс по slug (предмет = курс в нашей модели)
    course_result =  db.execute(
        select(Course).where(Course.slug == subject_slug, Course.is_published == True)
    )
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Получаем уроки этого курса
    result =  db.execute(
        select(Lesson)
        .where(Lesson.course_id == course.id, Lesson.is_published == True)
        .order_by(Lesson.order_number)
    )
    lessons = result.scalars().all()

    return LessonListResponse(
        lessons=[
            LessonResponse(
                id=l.id,
                slug=l.slug,
                title=l.title,
                description=l.description,
                estimated_minutes=l.estimated_minutes,
                content=l.content,
                course_id=l.course_id,
                order_number=l.order_number,
                is_published=l.is_published,
                created_at=l.created_at,
                view_count=l.view_count,
            )
            for l in lessons
        ],
        total=len(lessons),
    )


# === Эндпоинты для уровней языка ===


# 📚 Получить все уровни для языка
@app.get("/api/languages/{language_slug}/levels", response_model=LevelListResponse)
async def get_language_levels(language_slug: str, db: AsyncSession = Depends(get_db)):
    # Находим язык
    lang_result =  db.execute(
        select(Language).where(
            Language.slug == language_slug, Language.is_active == True
        )
    )
    language = lang_result.scalar_one_or_none()

    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    # Получаем уровни
    result =  db.execute(
        select(Level)
        .where(Level.language_id == language.id, Level.is_published == True)
        .order_by(Level.display_order)
    )
    levels = result.scalars().all()

    return LevelListResponse(
        levels=[
            LevelResponse(
                id=l.id,
                code=l.code,
                name=l.name,
                description=l.description,
                display_order=l.display_order,
                language_id=l.language_id,
                is_published=l.is_published,
                created_at=l.created_at,
                categories_count=0,  # Пока заглушка
            )
            for l in levels
        ],
        total=len(levels),
    )


# backend/main.py


@app.post(
    "/api/languages/{language_slug}/levels/{level_code}/categories/seed",
    status_code=201,
)
async def seed_category(
    language_slug: str,
    level_code: str,
    category_data: CategoryCreate,  # Pydantic model: slug, name, description, order_number
    db: AsyncSession = Depends(get_db),
):
    """🌱 Generic endpoint to seed ANY category (dev only)"""
    # 🔐 Only in development
    if os.getenv("DEBUG", "False").lower() != "true":
        raise HTTPException(status_code=403, detail="Only available in development")

    # Find language
    lang_result =  db.execute(
        select(Language).where(Language.slug == language_slug)
    )
    language = lang_result.scalar_one_or_none()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    # Find level
    level_result =  db.execute(
        select(Level).where(
            Level.language_id == language.id,
            Level.code == level_code.upper(),  # "a2" → "A2"
        )
    )
    level = level_result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    # Check if category already exists
    existing =  db.execute(
        select(Category).where(
            Category.slug == category_data.slug,  # ✅ No trailing spaces!
            Category.level_id == level.id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Category already exists", "slug": category_data.slug}

    # Create new category
    new_category = Category(
        slug=category_data.slug.strip(),  # ✅ Auto-trim
        name=category_data.name.strip(),
        description=category_data.description,
        order_number=category_data.order_number or 99,
        language_id=language.id,
        level_id=level.id,
        is_published=True,
    )

    db.add(new_category)
    db.commit()

    return {
        "message": "Category created",
        "slug": new_category.slug,
        "id": new_category.id,
        "name": new_category.name,
    }


# ✨ Создать тестовый уровень A2 для английского (только для dev!)
@app.post("/api/languages/english/levels/seed", status_code=201)
async def seed_a2_level(db: AsyncSession = Depends(get_db)):
    """Создаёт уровень A2 для английского (только dev)"""
    # Находим английский язык
    lang_result =  db.execute(select(Language).where(Language.slug == "english"))
    language = lang_result.scalar_one_or_none()
    if not language:
        raise HTTPException(status_code=404, detail="English language not found")

    # Проверяем, нет ли уже A2 (🔥 Убраны пробелы в "A2")
    result =  db.execute(
        select(Level).where(
            Level.code == "A2",  # ✅ Без пробелов!
            Level.language_id == language.id,
        )
    )
    if result.scalar_one_or_none():
        return {"message": "A2 level already exists", "code": "A2"}

    a2_level = Level(
        code="A2",  # ✅ Без пробелов
        name="Elementary",
        description="Базовый уровень: простые фразы, повседневные ситуации, базовая грамматика",
        display_order=2,
        language_id=language.id,
        is_published=True,
    )

    db.add(a2_level)
    db.commit()

    return {"message": "A2 level created", "code": a2_level.code, "id": a2_level.id}


# === Получить один язык по slug ===
@app.get("/api/languages/{language_slug}", response_model=LanguageResponse)
async def get_language(language_slug: str, db: AsyncSession = Depends(get_db)):
    result =  db.execute(
        select(Language).where(
            Language.slug == language_slug, Language.is_active == True
        )
    )
    language = result.scalar_one_or_none()

    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    return LanguageResponse(
        id=language.id,
        slug=language.slug,
        name=language.name,
        description=language.description,
        icon=language.icon,
        image=language.image,
        is_active=language.is_active,
        created_at=language.created_at,
    )


# ✨ Создать тестовый урок для математики (только для dev!)
@app.post("/api/ege/math-profile-ege/lessons/seed", status_code=201)
async def seed_math_lesson(db: AsyncSession = Depends(get_db)):
    # Находим курс "Профильная математика ЕГЭ"
    course_result =  db.execute(
        select(Course).where(Course.slug == "math-profile-ege")
    )
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Math course not found")

    # Проверяем, нет ли уже тестового урока
    result =  db.execute(
        select(Lesson).where(
            Lesson.slug == "algebra-basics", Lesson.course_id == course.id
        )
    )
    if result.scalar_one_or_none():
        return {"message": "Test lesson already exists"}

    test_lesson = Lesson(
        slug="algebra-basics",
        title="🔢 Основы алгебры",
        description="Переменные, уравнения, формулы — база для решения задач ЕГЭ",
        estimated_minutes=25,
        content="# Основы алгебры для ЕГЭ\n\n## Что такое переменная?\n\nПеременная — это буквенное обозначение числа...",
        course_id=course.id,
        order_number=1,
        is_published=True,
    )

    db.add(test_lesson)
    db.commit()

    return {"message": "Math lesson created", "slug": test_lesson.slug}


# === Эндпоинт для создания полного урока ЕГЭ с тестом (только для dev!) ===
@app.post("/api/ege/seed-full-lesson", status_code=201)
async def seed_ege_full_lesson(
    request_data: dict,  # ✅ FastAPI автоматически распарсит JSON
    db: AsyncSession = Depends(get_db),  # ✅ Добавляем зависимость БД
):
    """
    Создаёт: Курс ЕГЭ → Урок → Тест с вопросами
    """
    # Проверка: только в режиме разработки
    if not os.getenv("DEBUG", "True").lower() == "true":
        raise HTTPException(status_code=403, detail="Only available in development")

    # === 1. Создаём или находим курс ЕГЭ ===
    course_slug = request_data.get("course_slug", "math-profile-ege")
    course_result =  db.execute(select(Course).where(Course.slug == course_slug))
    course = course_result.scalar_one_or_none()

    if not course:
        course = Course(
            slug=course_slug,
            name=request_data.get("course_name", "Профильная математика ЕГЭ"),
            subject=request_data.get("subject", "Математика"),
            description=request_data.get(
                "course_description", "Полная подготовка к ЕГЭ по математике"
            ),
            image=request_data.get("course_image", "/math-icon.png"),
            is_published=True,
        )
        db.add(course)
        db.flush()

    # === 2. Создаём или находим урок ===
    lesson_slug = request_data.get("lesson_slug", "algebra-basics")
    lesson_result =  db.execute(
        select(Lesson).where(Lesson.slug == lesson_slug, Lesson.course_id == course.id)
    )
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        lesson = Lesson(
            slug=lesson_slug,
            title=request_data.get("lesson_title", "Основы алгебры"),
            description=request_data.get(
                "lesson_description", "Переменные, уравнения, формулы"
            ),
            content=request_data.get(
                "lesson_content",
                "# Основы алгебры\n\n## Переменные\n\nПеременная — это буквенное обозначение числа...",
            ),
            estimated_minutes=request_data.get("estimated_minutes", 25),
            course_id=course.id,
            order_number=request_data.get("order_number", 1),
            is_published=True,
        )
        db.add(lesson)
        db.flush()

    # === 3. Создаём или находим тест ===
    test_result =  db.execute(
        select(Test).where(Test.course_lesson_id == lesson.id)
    )
    test = test_result.scalar_one_or_none()

    if not test:
        test = Test(
            title=request_data.get("test_title", "Тест по уроку"),
            description=request_data.get("test_description"),
            course_lesson_id=lesson.id,  # 🔗 Для курсов/ЕГЭ
            passing_score=request_data.get("passing_score", 70),
            time_limit_minutes=request_data.get("time_limit_minutes", 10),
            is_published=True,
        )
        db.add(test)
        db.flush()

        # === 4. Добавляем вопросы ===
        for q_data in request_data.get("questions", []):  # ✅ Используем q_data
            question = Question(
                test_id=test.id,
                question_text=q_data["question_text"],
                question_type=q_data.get("question_type", "multiple_choice"),
                answer_type=q_data.get("answer_type"),
                option_a=q_data.get("option_a"),
                option_b=q_data.get("option_b"),
                option_c=q_data.get("option_c"),
                option_d=q_data.get("option_d"),
                correct_answer=q_data["correct_answer"],
                explanation=q_data.get("explanation"),
                order_number=q_data.get("order_number", 0),
            )
            db.add(question)

        # === 5. Привязываем test_id к уроку ===
        lesson.test_id = test.id

    db.commit()

    return {
        "message": "Full EGE lesson with test created",
        "course_slug": course.slug,
        "lesson_slug": lesson.slug,
        "test_id": test.id,
        "questions_count": len(request_data.get("questions", [])),
    }


#
#
#
#
#
@app.post("/api/ege/seed", status_code=201)
async def seed_ege_subjects(db: AsyncSession = Depends(get_db)):
    created = []

    ege_courses = [
        {
            "slug": "physics-ege",
            "name": "Физика ЕГЭ",
            "subject": "Физика",
            "description": "Полная подготовка к ЕГЭ по физике: теория, задачи, разборы",
            "image": "/physics-icon.png",
        },
        {
            "slug": "russian-ege",
            "name": "Русский ЕГЭ",
            "subject": "Русский язык",
            "description": "Подготовка к ЕГЭ по русскому: сочинения, тесты, правила",
            "image": "/russian-icon.png",
        },
        {
            "slug": "math-profile-ege",
            "name": "Профильная математика ЕГЭ",
            "subject": "Математика",
            "description": "Профильная математика: задачи с разбором, формулы, лайфхаки",
            "image": "/math-icon.png",
        },
        {
            "slug": "informatics-ege",
            "name": "Информатика ЕГЭ",
            "subject": "Информатика",
            "description": "ЕГЭ по информатике: программирование, алгоритмы, теория",
            "image": "/informatics-icon.png",
        },
    ]

    for course_ in ege_courses:  # 🔁 Переменная называется course_
        # Проверяем, нет ли уже такого курса
        result =  db.execute(
            select(Course).where(Course.slug == course_["slug"])
        )  # ✅ course_["slug"]
        if result.scalar_one_or_none():
            continue

        new_course = Course(
            slug=course_["slug"],  # ✅ course_
            name=course_["name"],
            subject=course_["subject"],
            description=course_["description"],
            image=course_["image"],
            is_published=True,
        )

        db.add(new_course)
        created.append(new_course.slug)

    db.commit()

    return {"message": f"Created {len(created)} EGE courses", "slugs": created}


# === Временное хранилище (пока без БД для пользователей) ===
fake_users_db = []

# === Эндпоинты аутентификации ===
# === Эндпоинты для языков ===


# ✨ Создать тестовый язык — Английский (только для dev!)


@app.post(
    "/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    user_data: UserRegister,  # ✅ Правильно: имя: Тип
    db: AsyncSession = Depends(get_db),  # ✅ Закрывающая скобка здесь
):
    try:
        import logging

        logger = logging.getLogger(__name__)
        logger.info(
            f"Register attempt: email={user_data.email}, password_length={len(user_data.password)}, password_repr={repr(user_data.password[:10])}"
        )

        # Проверка существующего пользователя
        result =  db.execute(
            select(User).where(
                (User.email == user_data.email) | (User.username == user_data.username)
            )
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            if existing_user.email == user_data.email:
                raise HTTPException(status_code=400, detail="User already registered")
            if existing_user.username == user_data.username:
                raise HTTPException(status_code=400, detail="Username already taken")

        # Хэшируем пароль и создаём пользователя
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=get_password_hash(user_data.password),
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return UserResponse(
            message="Успешно! Аккаунт создан",
            email=new_user.email,
            username=new_user.username,
        )

    except ValueError as e:
        # Ловим ошибку bcrypt
        if "password cannot be longer than 72 bytes" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Password too long (max 72 bytes / ~36 characters)",
            )
        raise  # Пробрасываем другие ошибки


async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Проверка существующего пользователя
    result = db.execute(
        select(User).where(
            (User.email == user_data.email) | (User.username == user_data.username)
        )
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(status_code=400, detail="User already registered")
        if existing_user.username == user_data.username:
            raise HTTPException(status_code=400, detail="Username already taken")

    # Хэшируем пароль и создаём пользователя
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        message="Успешно! Аккаунт создан",
        email=new_user.email,
        username=new_user.username,
    )


# === Эндпоинты для курсов ===


# 📚 Получить все опубликованные курсы
# backend/main.py — в эндпоинте /api/courses


@app.get("/api/courses", response_model=CourseListResponse)
async def get_courses(db: AsyncSession = Depends(get_db)):
    # 🔁 Решение 2: Фильтруем по slug
    # Исключаем ЕГЭ (содержит 'ege') и Языки (точное совпадение 'english', 'french' и т.д.)
    query = (
        select(Course)
        .where(
            and_(
                Course.is_published == True,
                not_(Course.slug.like("%ege%")),  # Скрываем ЕГЭ
                not_(
                    Course.slug.in_(["english", "french", "german", "spanish"])
                ),  # Скрываем языки
            )
        )
        .order_by(Course.created_at.desc())
    )

    result =  db.execute(query)
    courses = result.scalars().all()

    return CourseListResponse(
        courses=[CourseResponse.model_validate(c) for c in courses], total=len(courses)
    )


# backend/main.py


# backend/main.py


# 📖 Получить один курс по slug
@app.get("/api/courses/{slug}", response_model=CourseResponse)
async def get_course_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    result =  db.execute(
        select(Course).where(Course.slug == slug, Course.is_published == True)
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return CourseResponse(
        id=course.id,
        slug=course.slug,
        name=course.name,
        subject=course.subject,
        description=course.description,
        image=course.image,
        is_published=course.is_published,
        created_at=course.created_at,
    )


# ✨ Создать тестовый курс (только для dev!)
@app.post("/api/courses/seed", status_code=201)
async def seed_course(db: AsyncSession = Depends(get_db)):
    # Проверяем, нет ли уже тестового курса
    result =  db.execute(select(Course).where(Course.slug == "test-course"))
    if result.scalar_one_or_none():
        return {"message": "Test course already exists"}

    test_course = Course(
        slug="test-course",
        name="🚀 Введение в программирование",
        subject="Информатика",
        description="Базовый курс по программированию для начинающих. Изучи переменные, циклы, функции и создай свой первый проект!",
        image="/peek2.png",  # Или URL: "https://example.com/course.jpg"
        is_published=True,
    )

    db.add(test_course)
    db.commit()

    return {"message": "Test course created", "slug": test_course.slug}


# === Эндпоинты для уроков ===


# 📚 Получить все уроки курса
@app.get("/api/courses/{course_slug}/lessons", response_model=LessonListResponse)
async def get_course_lessons(course_slug: str, db: AsyncSession = Depends(get_db)):
    # Находим курс по slug
    course_result =  db.execute(select(Course).where(Course.slug == course_slug))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Получаем уроки этого курса
    result =db.execute(
        select(Lesson)
        .where(Lesson.course_id == course.id, Lesson.is_published == True)
        .order_by(Lesson.order_number)
    )
    lessons = result.scalars().all()

    return LessonListResponse(
        lessons=[
            LessonResponse(
                id=l.id,
                slug=l.slug,
                title=l.title,
                description=l.description,
                estimated_minutes=l.estimated_minutes,
                content=l.content,
                course_id=l.course_id,
                order_number=l.order_number,
                is_published=l.is_published,
                created_at=l.created_at,
                view_count=0,  # Пока заглушка
            )
            for l in lessons
        ],
        total=len(lessons),
    )


# 📖 Получить один урок по slug
@app.get(
    "/api/courses/{course_slug}/lessons/{lesson_slug}", response_model=LessonResponse
)
async def get_lesson_by_slug(
    course_slug: str, lesson_slug: str, db: AsyncSession = Depends(get_db)
):
    # Находим курс
    course_result =  db.execute(select(Course).where(Course.slug == course_slug))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 🔁 ВАЖНО: Выбираем ВСЕ поля урока, включая test_id
    lesson_result =  db.execute(
        select(Lesson).where(  # ✅ select(Lesson) выбирает все колонки!
            Lesson.slug == lesson_slug,
            Lesson.course_id == course.id,
            Lesson.is_published == True,
        )
    )
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # 🔁 Возвращаем через Pydantic-схему (она автоматически подхватит test_id)
    return LessonResponse.model_validate(lesson)  # ✅ Или from_attributes=True в Config


# ✨ Создать тестовый урок (только для dev!)
@app.post("/api/courses/{course_slug}/lessons/seed", status_code=201)
async def seed_lesson(course_slug: str, db: AsyncSession = Depends(get_db)):
    # Находим курс
    course_result =  db.execute(select(Course).where(Course.slug == course_slug))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Проверяем, нет ли уже тестового урока
    result =  db.execute(
        select(Lesson).where(
            Lesson.slug == "intro-lesson", Lesson.course_id == course.id
        )
    )
    if result.scalar_one_or_none():
        return {"message": "Test lesson already exists"}

    test_lesson = Lesson(
        slug="intro-lesson",
        title="🎯 Введение в курс",
        description="Первый урок: что вы узнаете и как работать с материалом",
        estimated_minutes=10,
        content="# Добро пожаловать!\n\nВ этом курсе вы изучите основы...",
        course_id=course.id,
        order_number=1,
        is_published=True,
    )

    db.add(test_lesson)
    db.commit()

    return {"message": "Test lesson created", "slug": test_lesson.slug}


# === Эндпоинты статей ===


@app.get("/api/articles", response_model=ArticleListResponse)
async def get_articles(db: AsyncSession = Depends(get_db)):
    result =  db.execute(select(Article).order_by(Article.created_at.desc()))
    articles = result.scalars().all()

    return ArticleListResponse(
        articles=[
            ArticleResponse(
                id=a.id,
                slug=a.slug,
                name=a.name,
                category=a.category,
                time=a.time,
                text=a.text,
                image=a.image,
                created_at=a.created_at,
                view_count=0,
            )
            for a in articles
        ],
        total=len(articles),
    )


@app.get("/api/articles/{slug}", response_model=ArticleResponse)
async def get_article_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    result = db.execute(select(Article).where(Article.slug == slug))
    article = result.scalar_one_or_none()

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    return ArticleResponse(
        id=article.id,
        slug=article.slug,
        name=article.name,
        category=article.category,
        time=article.time,
        text=article.text,
        image=article.image,
        created_at=article.created_at,
        view_count=0,
    )


@app.post("/api/articles/seed", status_code=201)
async def seed_article(db: AsyncSession = Depends(get_db)):
    result =  db.execute(select(Article).where(Article.slug == "test-article"))
    if result.scalar_one_or_none():
        return {"message": "Test article already exists"}

    test_article = Article(
        slug="test-article",
        name="🎉 Тестовая статья",
        category="Тест",
        time="2 мин",
        text="Это тестовая статья для проверки работы бэкенда. Если ты видишь этот текст — значит, всё работает! 🚀",
        image="/peek1.png",
    )

    db.add(test_article)
    db.commit()

    return {"message": "Test article created", "slug": test_article.slug}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
