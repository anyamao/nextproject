from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import os
from sqlalchemy.dialects.postgresql import insert
from dotenv import load_dotenv
from datetime import datetime, timezone
from database import engine, Base, get_db
from sqlalchemy.dialects.postgresql import insert
from models import (
    User,
    EgeSubject,
    EgeLesson,
    EgeTest,
    EgeTestQuestion,
    TestResult,
    LessonView,
    LessonReaction,
)
from schemas import (
    UserRegister,
    UserLogin,
    Token,
    UserOut,
    EgeSubjectCreate,
    EgeSubjectOut,
    EgeLessonCreate,
    EgeLessonOut,
    EgeLessonList,
    TestQuestionCreate,
    EgeTestCreate,
    TestQuestionOut,
    EgeTestOut,
    TestSubmission,
    TestResultCreate,
    TestResultOut,
    TestSubmissionResult,
    LessonViewOut,
    LessonViewCreate,
    ReactionCreate,
    LessonStatsOut,
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)


from sqlalchemy.orm import selectinload

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ✅ При старте создаём таблицы (если их нет)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ БД подключена. Таблицы проверены/созданы.")
    yield
    # При остановке
    await engine.dispose()


app = FastAPI(title="NextProject Auth API", version="1.0.0", lifespan=lifespan)

# 🔐 CORS — для localhost и домена
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3010",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3010",
        "https://maoschool.ru",
        "https://www.maoschool.ru",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === РЕГИСТРАЦИЯ =
#
#


# 🆕 Регистрация
@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Проверка email
    existing_email = await db.execute(
        select(User).where(User.email == user_data.email.lower())
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already registered")

    # Проверка username
    existing_user = await db.execute(
        select(User).where(User.username == user_data.username.lower())
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Создание
    new_user = User(
        email=user_data.email.lower(),
        username=user_data.username.lower(),
        hashed_password=get_password_hash(user_data.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"sub": new_user.email})
    return Token(
        access_token=token,
        user=UserOut(id=new_user.id, email=new_user.email, username=new_user.username),
    )


# 🆕 Вход
@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.email == credentials.email.lower())
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid login credentials")

    token = create_access_token({"sub": user.email})
    return Token(
        access_token=token,
        user=UserOut(id=user.id, email=user.email, username=user.username),
    )


# 🔐 Защищённый маршрут (тест токена)
@app.get("/auth/me", response_model=UserOut)
async def read_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id, email=current_user.email, username=current_user.username
    )


# ============================================================================
# 👍👎 РЕАКЦИИ (ЛАЙКИ/ДИЗЛАЙКИ)
# ============================================================================


# 📤 Поставить реакцию (только авторизованным)
@app.post("/lessons/{lesson_id}/reaction", status_code=status.HTTP_200_OK)
async def set_lesson_reaction(
    lesson_id: int,
    data: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Определяем новое значение
    # Если reaction_type == "none", значит удаляем голос, иначе ставим True/False
    if data.reaction_type == "none":
        new_is_like = None
    else:
        new_is_like = data.reaction_type == "like"

    # 1. Ищем существующую запись
    existing_stmt = select(LessonReaction).where(
        LessonReaction.user_id == current_user.id, LessonReaction.lesson_id == lesson_id
    )
    res = await db.execute(existing_stmt)
    existing_reaction = res.scalar_one_or_none()

    if new_is_like is None:
        # 🗑️ Удаление реакции
        if existing_reaction:
            await db.delete(existing_reaction)
            await db.commit()
        return {"message": "Reaction removed"}
    else:
        # ✅ Обновление или создание (UPSERT)
        if existing_reaction:
            existing_reaction.is_like = new_is_like
        else:
            db.add(
                LessonReaction(
                    user_id=current_user.id, lesson_id=lesson_id, is_like=new_is_like
                )
            )

        await db.commit()
        return {"message": f"Reaction set to {data.reaction_type}"}


# 📊 Получить статистику урока (публичный + личная реакция юзера)
@app.get("/lessons/{lesson_id}/stats", response_model=LessonStatsOut)
async def get_lesson_stats(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),  # 🔓 Может быть None (гость)
):
    # 1. Считаем лайки
    likes_stmt = select(func.count(LessonReaction.id)).where(
        LessonReaction.lesson_id == lesson_id, LessonReaction.is_like == True
    )
    likes = await db.scalar(likes_stmt) or 0

    # 2. Считаем дизлайки
    dislikes_stmt = select(func.count(LessonReaction.id)).where(
        LessonReaction.lesson_id == lesson_id, LessonReaction.is_like == False
    )
    dislikes = await db.scalar(dislikes_stmt) or 0

    # 3. Получаем реакцию текущего юзера (если вошел)
    user_reaction = None
    if current_user:
        stmt = select(LessonReaction.is_like).where(
            LessonReaction.user_id == current_user.id,
            LessonReaction.lesson_id == lesson_id,
        )
        res = await db.execute(stmt)
        val = res.scalar_one_or_none()
        if val is True:
            user_reaction = "like"
        elif val is False:
            user_reaction = "dislike"

    return LessonStatsOut(likes=likes, dislikes=dislikes, user_reaction=user_reaction)


# ============================================================================
# 👁️ ПРОСМОТРЫ УРОКОВ
# ============================================================================


# 📤 Записать просмотр урока (только авторизованные, идемпотентно)
@app.post("/ege/{subject}/{lesson}/view", status_code=status.HTTP_201_CREATED)
async def record_lesson_view(
    subject: str,
    lesson: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 🔐 Только авторизованные
):
    # Находим урок по slug
    stmt = select(EgeLesson).where(EgeLesson.slug == lesson)
    lesson_obj = await db.scalar(stmt)

    if not lesson_obj:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # 🔁 INSERT ... ON CONFLICT DO NOTHING (идемпотентность)

    stmt = insert(LessonView).values(user_id=current_user.id, lesson_id=lesson_obj.id)
    stmt = stmt.on_conflict_do_nothing(  # ✅ Если уже есть — ничего не делаем
        index_elements=["user_id", "lesson_id"]
    )

    await db.execute(stmt)
    await db.commit()

    return {"message": "View recorded"}


# 📥 Получить количество просмотров урока (публичный)
@app.get("/ege/{subject}/{lesson}/views")
async def get_lesson_views(
    subject: str, lesson: str, db: AsyncSession = Depends(get_db)
):
    # Находим урок
    stmt = select(EgeLesson).where(EgeLesson.slug == lesson)
    lesson_obj = await db.scalar(stmt)

    if not lesson_obj:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Считаем уникальные просмотры
    count_stmt = select(func.count(LessonView.id)).where(
        LessonView.lesson_id == lesson_obj.id
    )
    count = await db.scalar(count_stmt)

    return {"view_count": count or 0}


# ЕГЭ ЭНДПОИНТЫ ТУТ!! ege_native


# 📤 Сохранение результата в БД (только для авторизованных)
@app.post(
    "/tests/{test_id}/complete",
    response_model=TestResultOut,
    status_code=status.HTTP_201_CREATED,
)
async def complete_test(
    test_id: int,
    result_: TestResultCreate,  # ✅ Двоеточие!
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Проверяем, что тест существует
    test = await db.get(EgeTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # UPSERT: обновляем или создаём запись
    stmt = insert(TestResult).values(
        user_id=current_user.id,
        test_id=test_id,
        score=result_.score,
        passed=result_.passed,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["user_id", "test_id"],
        set_={
            "score": result_.score,
            "passed": result_.passed,
            "completed_at": func.now(),
        },
    )

    await db.execute(stmt)
    await db.commit()

    # Возвращаем схему ИЗ БД
    return TestResultOut(
        score=result_.score,
        passed=result_.passed,
        completed_at=datetime.now(timezone.utc),
    )


@app.get("/tests/{test_id}/result", response_model=TestResultOut | None)
async def get_user_test_result(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 🔐 Только для авторизованных
):
    result = await db.execute(
        select(TestResult).where(
            TestResult.test_id == test_id, TestResult.user_id == current_user.id
        )
    )
    return result.scalar_one_or_none()


# 📚 ЕГЭ: Получить все предметы (публичный, без авторизации)
@app.get("/ege", response_model=list[EgeSubjectOut])
async def get_all_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EgeSubject).order_by(EgeSubject.title))
    return result.scalars().all()


@app.get("/ege/{slug}", response_model=list[EgeLessonOut])
async def get_subject_lessons(slug: str, db: AsyncSession = Depends(get_db)):
    # Проверяем, существует ли предмет с таким slug
    subject_result = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    subject = subject_result.scalar_one_or_none()

    if not subject:
        raise HTTPException(status_code=404, detail=f"Subject '{slug}' not found")

    # Возвращаем все уроки этого предмета
    result = await db.execute(
        select(EgeLesson)
        .where(EgeLesson.subject_id == subject.id)
        .order_by(EgeLesson.created_at)
    )
    return result.scalars().all()


@app.get("/ege/{subject}/{lesson}", response_model=EgeLessonOut)
async def get_single_lesson(
    subject: str, lesson: str, db: AsyncSession = Depends(get_db)
):
    # Проверяем, что предмет существует
    subject_result = await db.execute(
        select(EgeSubject).where(EgeSubject.slug == subject)
    )
    subject_obj = subject_result.scalar_one_or_none()
    if not subject_obj:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Ищем урок по slug (уникален глобально, но проверяем принадлежность к предмету)
    result = await db.execute(
        select(EgeLesson).where(
            EgeLesson.slug == lesson, EgeLesson.subject_id == subject_obj.id
        )
    )
    lesson_obj = result.scalar_one_or_none()

    if not lesson_obj:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return lesson_obj


@app.get("/tests/{test_id}", response_model=EgeTestOut)
async def get_test(test_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(EgeTest)
        .options(
            selectinload(EgeTest.questions).load_only(
                EgeTestQuestion.id,
                EgeTestQuestion.question_text,
                EgeTestQuestion.order_index,
            )
        )
        .where(EgeTest.id == test_id)
    )
    res = await db.execute(stmt)
    test = res.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    questions_out = [
        TestQuestionOut(
            id=q.id, question_text=q.question_text, order_index=q.order_index
        )
        for q in test.questions
    ]
    return EgeTestOut(
        id=test.id,
        lesson_id=test.lesson_id,
        title=test.title,
        passing_score=test.passing_score,
        questions=questions_out,
    )


# ✅ Проверка ОДНОГО ответа (для пошагового режима)
@app.post("/tests/{test_id}/question/{question_id}/check")
async def check_single_answer(
    test_id: int, question_id: int, answer: str, db: AsyncSession = Depends(get_db)
):
    # Находим вопрос и проверяем, что он принадлежит этому тесту
    stmt = select(EgeTestQuestion).where(
        EgeTestQuestion.id == question_id, EgeTestQuestion.test_id == test_id
    )
    res = await db.execute(stmt)
    question = res.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Нормализуем ответы для сравнения
    user_ans = answer.strip().lower().replace(",", ".")
    correct_ans = question.correct_answer.strip().lower().replace(",", ".")

    is_correct = user_ans == correct_ans

    return {
        "correct": is_correct,
        "expected": correct_ans
        if not is_correct
        else None,  # Показываем правильный ответ только если ошибся
        "question_id": question_id,
    }


# 📤 Проверка ответов (публичный, не сохраняет в БД)
@app.post("/tests/{test_id}/submit", response_model=TestSubmissionResult)
async def submit_test(
    test_id: int, submission: TestSubmission, db: AsyncSession = Depends(get_db)
):
    # Находим тест с вопросами
    stmt = (
        select(EgeTest)
        .options(selectinload(EgeTest.questions))
        .where(EgeTest.id == test_id)
    )
    res = await db.execute(stmt)
    test = res.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Считаем правильные ответы
    total = len(test.questions)
    correct = 0

    for q in test.questions:
        user_ans = (
            submission.answers.get(str(q.id), "").strip().lower().replace(",", ".")
        )
        correct_ans = q.correct_answer.strip().lower().replace(",", ".")
        if user_ans == correct_ans:
            correct += 1

    score = (correct / total) * 100 if total > 0 else 0
    passed = score >= test.passing_score

    # ✅ Возвращаем схему ПРОВЕРКИ (не БД!)
    return TestSubmissionResult(
        score=round(score, 1),
        passed=passed,
        total_questions=total,
        correct_count=correct,
    )


##снизу конец!!!!!!!1###############


@app.get("/health")
async def health():
    return {"status": "ok", "db": "postgresql_asyncpg"}
