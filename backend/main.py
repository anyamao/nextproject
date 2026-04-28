# backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import os
from sqlalchemy.dialects.postgresql import insert
from dotenv import load_dotenv
from datetime import datetime, timezone
from database import engine, Base, get_db
from typing import Any, Dict, Literal, Optional
from models import (
    User,
    EgeSubject,
    EgeLesson,
    EgeTest,
    EgeTestQuestion,
    TestResult,
    LessonView,
    LessonReaction,
    Article,
    ArticleView,
    ArticleReaction,
    Comment,
    CommentReaction,
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
    ArticleCreate,
    ArticleOut,
    ArticleReactionCreate,
    ArticleStatsOut,
    CommentCreate,
    CommentOut,
    CommentReactionCreate,
    UserOut,
    UserUpdate,
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
)
from sqlalchemy.orm import selectinload

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ БД подключена. Таблицы проверены/созданы.")
    yield
    await engine.dispose()


app = FastAPI(title="NextProject Auth API", version="1.0.0", lifespan=lifespan)

# 🔐 CORS
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


# ============================================================================
# 🔐 AUTH
# ============================================================================


@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing_email = await db.execute(
        select(User).where(User.email == user_data.email.lower())
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already registered")
    existing_user = await db.execute(
        select(User).where(User.username == user_data.username.lower())
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")
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


@app.get("/auth/me", response_model=UserOut)
async def read_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id, email=current_user.email, username=current_user.username
    )


@app.get("/profile", response_model=UserOut)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        avatar_url=current_user.avatar_url or "gray_cat.jpg",
        status=current_user.status,
        created_at=current_user.created_at,
    )


@app.patch("/profile/settings", response_model=UserOut)
async def update_profile_settings(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Проверка юзернейма
    if data.username and data.username != current_user.username:
        existing = await db.execute(
            select(User).where(User.username == data.username.lower())
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = data.username.lower()

    # ✅ Обновление аватара (только из разрешённого списка)
    ALLOWED_AVATARS = {
        "default_cat.jpg",
        "orange_cat.jpg",
        "black_cat.jpg",
        "gray_cat.jpg",
        "brown_cat.jpg",
        "light_gray_cat.jpg",
        "white_cat.jpg",
    }

    if data.avatar_url is not None:
        if data.avatar_url not in ALLOWED_AVATARS:
            raise HTTPException(status_code=400, detail="Invalid avatar")
        current_user.avatar_url = data.avatar_url

    if data.status is not None:
        current_user.status = data.status

    current_user.updated_at = datetime.now()
    await db.commit()
    await db.refresh(current_user)

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        avatar_url=current_user.avatar_url,
        status=current_user.status,
        created_at=current_user.created_at,
    )


# ============================================================================
# 📚 ЕГЭ: СТАТИЧЕСКИЕ МАРШРУТЫ (ПЕРВЫМИ!)
# ============================================================================

EGE_SLUGS = ["math-profile", "physics-ege", "russian-ege", "informatics-ege"]


# ✅ Список предметов ЕГЭ (статический — должен быть ДО /ege/{slug})
@app.get("/ege/subjects", response_model=list[EgeSubjectOut])
async def get_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EgeSubject).order_by(EgeSubject.title))
    return result.scalars().all()


# ✅ Все предметы ЕГЭ (фильтр по списку)
@app.get("/ege", response_model=list[EgeSubjectOut])
async def get_all_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EgeSubject)
        .where(EgeSubject.slug.in_(EGE_SLUGS))
        .order_by(EgeSubject.title)
    )
    return result.scalars().all()


# ============================================================================
# 📚 ЕГЭ: ДИНАМИЧЕСКИЕ МАРШРУТЫ (ПОСЛЕ СТАТИЧЕСКИХ!)
# ============================================================================


@app.get("/ege/{slug}", response_model=list[EgeLessonOut])
async def get_subject_lessons(slug: str, db: AsyncSession = Depends(get_db)):
    subject_result = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    subject = subject_result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail=f"Subject '{slug}' not found")
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
    subject_result = await db.execute(
        select(EgeSubject).where(EgeSubject.slug == subject)
    )
    subject_obj = subject_result.scalar_one_or_none()
    if not subject_obj:
        raise HTTPException(status_code=404, detail="Subject not found")
    result = await db.execute(
        select(EgeLesson).where(
            EgeLesson.slug == lesson, EgeLesson.subject_id == subject_obj.id
        )
    )
    lesson_obj = result.scalar_one_or_none()
    if not lesson_obj:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson_obj


# 👁️ Записать просмотр урока (по slug, только авторизованные)
@app.post("/ege/{subject}/{lesson}/view", status_code=status.HTTP_201_CREATED)
async def record_lesson_view(
    subject: str,
    lesson: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(EgeLesson).where(EgeLesson.slug == lesson)
    lesson_obj = await db.scalar(stmt)
    if not lesson_obj:
        raise HTTPException(status_code=404, detail="Lesson not found")
    stmt = insert(LessonView).values(user_id=current_user.id, lesson_id=lesson_obj.id)
    stmt = stmt.on_conflict_do_nothing(index_elements=["user_id", "lesson_id"])
    await db.execute(stmt)
    await db.commit()
    return {"message": "View recorded"}


# 📥 Получить просмотры урока (по slug, публичный)
@app.get("/ege/{subject}/{lesson}/views")
async def get_lesson_views(
    subject: str, lesson: str, db: AsyncSession = Depends(get_db)
):
    stmt = select(EgeLesson).where(EgeLesson.slug == lesson)
    lesson_obj = await db.scalar(stmt)
    if not lesson_obj:
        raise HTTPException(status_code=404, detail="Lesson not found")
    count_stmt = select(func.count(LessonView.id)).where(
        LessonView.lesson_id == lesson_obj.id
    )
    count = await db.scalar(count_stmt)
    return {"view_count": count or 0}


# ============================================================================
# 💻 КУРСЫ: СТАТИЧЕСКИЕ МАРШРУТЫ (ПЕРВЫМИ!)
# ============================================================================


# ✅ Список курсов (исключая ЕГЭ) — статический, должен быть ДО /courses/{slug}
@app.get("/courses/subjects", response_model=list[EgeSubjectOut])
async def get_course_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EgeSubject)
        .where(~EgeSubject.slug.in_(EGE_SLUGS))
        .order_by(EgeSubject.title)
    )
    return result.scalars().all()


# ============================================================================
# 💻 КУРСЫ: ДИНАМИЧЕСКИЕ МАРШРУТЫ (ПОСЛЕ СТАТИЧЕСКИХ!)
# ============================================================================


@app.get("/courses/{slug}", response_model=list[EgeLessonOut])
async def get_course_lessons(slug: str, db: AsyncSession = Depends(get_db)):
    if slug in EGE_SLUGS:
        raise HTTPException(
            status_code=404, detail="This subject belongs to /ege/ section"
        )
    subject_result = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    subject = subject_result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    result = await db.execute(
        select(EgeLesson)
        .where(EgeLesson.subject_id == subject.id)
        .order_by(EgeLesson.created_at)
    )
    return result.scalars().all()


@app.get("/courses/{subject}/{lesson}", response_model=EgeLessonOut)
async def get_course_lesson(
    subject: str, lesson: str, db: AsyncSession = Depends(get_db)
):
    if subject in EGE_SLUGS:
        raise HTTPException(
            status_code=404, detail="This lesson belongs to /ege/ section"
        )
    subject_result = await db.execute(
        select(EgeSubject).where(EgeSubject.slug == subject)
    )
    subject_obj = subject_result.scalar_one_or_none()
    if not subject_obj:
        raise HTTPException(status_code=404, detail="Subject not found")
    lesson_result = await db.execute(
        select(EgeLesson).where(
            EgeLesson.slug == lesson, EgeLesson.subject_id == subject_obj.id
        )
    )
    lesson_obj = lesson_result.scalar_one_or_none()
    if not lesson_obj:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson_obj


# ============================================================================
# 📰 СТАТЬИ: СТАТИЧЕСКИЕ МАРШРУТЫ (ПЕРВЫМИ!)
# ============================================================================

ARTICLE_TOPICS_LIST = [
    "забота о себе",
    "продуктивность",
    "технологии",
    "лайфхаки",
    "мотивация",
]


# ✅ Список статей (статический — ДО /articles/{slug})
@app.get("/articles", response_model=list[ArticleOut])
async def get_articles(
    topic: str | None = Query(None), db: AsyncSession = Depends(get_db)
):
    stmt = select(Article).order_by(Article.created_at.desc())
    if topic and topic in ARTICLE_TOPICS_LIST:
        stmt = stmt.where(Article.topic == topic)
    result = await db.execute(stmt)
    return result.scalars().all()


# ============================================================================
# 📰 СТАТЬИ: ДИНАМИЧЕСКИЕ МАРШРУТЫ
# ============================================================================


@app.get("/articles/{slug}", response_model=ArticleOut)
async def get_article(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Article).where(Article.slug == slug))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


# 👁️ Просмотр статьи
@app.post("/articles/{slug}/view", status_code=status.HTTP_201_CREATED)
async def record_article_view(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article_result = await db.execute(select(Article).where(Article.slug == slug))
    article = article_result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    stmt = insert(ArticleView).values(user_id=current_user.id, article_id=article.id)
    stmt = stmt.on_conflict_do_nothing(index_elements=["user_id", "article_id"])
    await db.execute(stmt)
    await db.commit()
    return {"message": "View recorded"}


# 👍 Реакция на статью
@app.post("/articles/{slug}/reaction", status_code=status.HTTP_200_OK)
async def set_article_reaction(
    slug: str,
    data: ArticleReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article_result = await db.execute(select(Article).where(Article.slug == slug))
    article = article_result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if data.reaction_type == "none":
        new_is_like = None
    else:
        new_is_like = data.reaction_type == "like"
    existing_stmt = select(ArticleReaction).where(
        ArticleReaction.user_id == current_user.id,
        ArticleReaction.article_id == article.id,
    )
    res = await db.execute(existing_stmt)
    existing_reaction = res.scalar_one_or_none()
    if new_is_like is None:
        if existing_reaction:
            await db.delete(existing_reaction)
            await db.commit()
        return {"message": "Reaction removed"}
    else:
        if existing_reaction:
            existing_reaction.is_like = new_is_like
        else:
            db.add(
                ArticleReaction(
                    user_id=current_user.id, article_id=article.id, is_like=new_is_like
                )
            )
        await db.commit()
        return {"message": f"Reaction set to {data.reaction_type}"}


# 📊 Статистика статьи
@app.get("/articles/{slug}/stats", response_model=ArticleStatsOut)
async def get_article_stats(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    article_result = await db.execute(select(Article).where(Article.slug == slug))
    article = article_result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    likes = (
        await db.scalar(
            select(func.count(ArticleReaction.id)).where(
                ArticleReaction.article_id == article.id,
                ArticleReaction.is_like == True,
            )
        )
        or 0
    )
    dislikes = (
        await db.scalar(
            select(func.count(ArticleReaction.id)).where(
                ArticleReaction.article_id == article.id,
                ArticleReaction.is_like == False,
            )
        )
        or 0
    )
    views = (
        await db.scalar(
            select(func.count(ArticleView.id)).where(
                ArticleView.article_id == article.id
            )
        )
        or 0
    )
    user_reaction = None
    if current_user:
        stmt = select(ArticleReaction.is_like).where(
            ArticleReaction.user_id == current_user.id,
            ArticleReaction.article_id == article.id,
        )
        res = await db.execute(stmt)
        val = res.scalar_one_or_none()
        if val is True:
            user_reaction = "like"
        elif val is False:
            user_reaction = "dislike"
    return ArticleStatsOut(
        likes=likes, dislikes=dislikes, views=views, user_reaction=user_reaction
    )


# ============================================================================
# 🔁 УНИВЕРСАЛЬНЫЕ ЭНДПОИНТЫ ДЛЯ УРОКОВ (ПО ID) — РАБОТАЮТ ДЛЯ /ege/ И /courses/
# ============================================================================


@app.get("/lessons/{lesson_id}", response_model=EgeLessonOut)
async def get_lesson_by_id(lesson_id: int, db: AsyncSession = Depends(get_db)):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@app.post("/lessons/{lesson_id}/view", status_code=status.HTTP_201_CREATED)
async def record_lesson_view_by_id(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    stmt = insert(LessonView).values(user_id=current_user.id, lesson_id=lesson_id)
    stmt = stmt.on_conflict_do_nothing(index_elements=["user_id", "lesson_id"])
    await db.execute(stmt)
    await db.commit()
    return {"message": "View recorded"}


@app.get("/lessons/{lesson_id}/views")
async def get_lesson_views_by_id(lesson_id: int, db: AsyncSession = Depends(get_db)):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    count = await db.scalar(
        select(func.count(LessonView.id)).where(LessonView.lesson_id == lesson_id)
    )
    return {"view_count": count or 0}


@app.post("/lessons/{lesson_id}/reaction", status_code=status.HTTP_200_OK)
async def set_lesson_reaction_by_id(
    lesson_id: int,
    data: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if data.reaction_type == "none":
        new_is_like = None
    else:
        new_is_like = data.reaction_type == "like"
    existing_stmt = select(LessonReaction).where(
        LessonReaction.user_id == current_user.id, LessonReaction.lesson_id == lesson_id
    )
    res = await db.execute(existing_stmt)
    existing_reaction = res.scalar_one_or_none()
    if new_is_like is None:
        if existing_reaction:
            await db.delete(existing_reaction)
            await db.commit()
        return {"message": "Reaction removed"}
    else:
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


@app.get("/lessons/{lesson_id}/stats", response_model=LessonStatsOut)
async def get_lesson_stats_by_id(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    likes = (
        await db.scalar(
            select(func.count(LessonReaction.id)).where(
                LessonReaction.lesson_id == lesson_id, LessonReaction.is_like == True
            )
        )
        or 0
    )
    dislikes = (
        await db.scalar(
            select(func.count(LessonReaction.id)).where(
                LessonReaction.lesson_id == lesson_id, LessonReaction.is_like == False
            )
        )
        or 0
    )
    views = (
        await db.scalar(
            select(func.count(LessonView.id)).where(LessonView.lesson_id == lesson_id)
        )
        or 0
    )
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
    return LessonStatsOut(
        likes=likes, dislikes=dislikes, views=views, user_reaction=user_reaction
    )


# ============================================================================
# 🧪 ТЕСТЫ
# ============================================================================


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


@app.post("/tests/{test_id}/question/{question_id}/check")
async def check_single_answer(
    test_id: int, question_id: int, answer: str, db: AsyncSession = Depends(get_db)
):
    stmt = select(EgeTestQuestion).where(
        EgeTestQuestion.id == question_id, EgeTestQuestion.test_id == test_id
    )
    res = await db.execute(stmt)
    question = res.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    user_ans = answer.strip().lower().replace(",", ".")
    correct_ans = question.correct_answer.strip().lower().replace(",", ".")
    is_correct = user_ans == correct_ans
    return {
        "correct": is_correct,
        "expected": correct_ans if not is_correct else None,
        "question_id": question_id,
    }


@app.post("/tests/{test_id}/submit", response_model=TestSubmissionResult)
async def submit_test(
    test_id: int, submission: TestSubmission, db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(EgeTest)
        .options(selectinload(EgeTest.questions))
        .where(EgeTest.id == test_id)
    )
    res = await db.execute(stmt)
    test = res.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
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
    return TestSubmissionResult(
        score=round(score, 1),
        passed=passed,
        total_questions=total,
        correct_count=correct,
    )


@app.post(
    "/tests/{test_id}/complete",
    response_model=TestResultOut,
    status_code=status.HTTP_201_CREATED,
)
async def complete_test(
    test_id: int,
    result_: TestResultCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    test = await db.get(EgeTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
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
    return TestResultOut(
        score=result_.score,
        passed=result_.passed,
        completed_at=datetime.now(timezone.utc),
    )


@app.get("/tests/{test_id}/result", response_model=TestResultOut | None)
async def get_user_test_result(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(TestResult).where(
            TestResult.test_id == test_id, TestResult.user_id == current_user.id
        )
    )
    return result.scalar_one_or_none()


# ============================================================================
# 👍👎 РЕАКЦИИ НА УРОКИ (СТАРОЕ — ОСТАВЛЕНО ДЛЯ СОВМЕСТИМОСТИ)
# ============================================================================


# 📤 Поставить реакцию (только авторизованным)
@app.post("/lessons/{lesson_id}/reaction", status_code=status.HTTP_200_OK)
async def set_lesson_reaction(
    lesson_id: int,
    data: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.reaction_type == "none":
        new_is_like = None
    else:
        new_is_like = data.reaction_type == "like"
    existing_stmt = select(LessonReaction).where(
        LessonReaction.user_id == current_user.id, LessonReaction.lesson_id == lesson_id
    )
    res = await db.execute(existing_stmt)
    existing_reaction = res.scalar_one_or_none()
    if new_is_like is None:
        if existing_reaction:
            await db.delete(existing_reaction)
            await db.commit()
        return {"message": "Reaction removed"}
    else:
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


##########ВСЕ ЧТО СВЯЗАННО С КОММЕНТАРИЯМИ К УРОКАМ СНИЗУ
@app.delete("/comments/{comment_id}", status_code=status.HTTP_200_OK)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Находим комментарий
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Проверяем права: только автор может удалить
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not allowed to delete this comment"
        )

    # Удаляем
    await db.delete(comment)
    await db.commit()

    # ✅ 204 No Content — тело ответа не нужно
    return {"message": "Comment deleted", "id": comment_id}


@app.post("/comments/{comment_id}/reaction", status_code=status.HTTP_200_OK)
async def set_comment_reaction(
    comment_id: int,
    data: CommentReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Проверяем, что комментарий существует
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Определяем новое значение
    if data.reaction_type == "none":
        new_is_like = None
    else:
        new_is_like = data.reaction_type == "like"

    # Ищем существующую реакцию
    existing_stmt = select(CommentReaction).where(
        CommentReaction.user_id == current_user.id,
        CommentReaction.comment_id == comment_id,
    )
    res = await db.execute(existing_stmt)
    existing_reaction = res.scalar_one_or_none()

    if new_is_like is None:
        # Удаление реакции
        if existing_reaction:
            await db.delete(existing_reaction)
            await db.commit()
        return {"message": "Reaction removed"}
    else:
        # Обновление или создание
        if existing_reaction:
            existing_reaction.is_like = new_is_like
        else:
            db.add(
                CommentReaction(
                    user_id=current_user.id, comment_id=comment_id, is_like=new_is_like
                )
            )
        await db.commit()
        return {"message": f"Reaction set to {data.reaction_type}"}


@app.get("/comments/{comment_id}/stats")
async def get_comment_stats(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Считаем лайки
    likes = (
        await db.scalar(
            select(func.count(CommentReaction.id)).where(
                CommentReaction.comment_id == comment_id,
                CommentReaction.is_like == True,
            )
        )
        or 0
    )

    # Считаем дизлайки
    dislikes = (
        await db.scalar(
            select(func.count(CommentReaction.id)).where(
                CommentReaction.comment_id == comment_id,
                CommentReaction.is_like == False,
            )
        )
        or 0
    )

    # Реакция текущего пользователя
    user_reaction = None
    if current_user:
        stmt = select(CommentReaction.is_like).where(
            CommentReaction.user_id == current_user.id,
            CommentReaction.comment_id == comment_id,
        )
        res = await db.execute(stmt)
        val = res.scalar_one_or_none()
        if val is True:
            user_reaction = "like"
        elif val is False:
            user_reaction = "dislike"

    return {"likes": likes, "dislikes": dislikes, "user_reaction": user_reaction}


async def format_comment_with_stats(
    comment: Comment, db: AsyncSession, current_user: User | None
) -> Dict[str, Any]:
    # Считаем реакции
    likes = (
        await db.scalar(
            select(func.count(CommentReaction.id)).where(
                CommentReaction.comment_id == comment.id,
                CommentReaction.is_like == True,
            )
        )
        or 0
    )
    dislikes = (
        await db.scalar(
            select(func.count(CommentReaction.id)).where(
                CommentReaction.comment_id == comment.id,
                CommentReaction.is_like == False,
            )
        )
        or 0
    )

    user_reaction = None
    if current_user:
        stmt = select(CommentReaction.is_like).where(
            CommentReaction.user_id == current_user.id,
            CommentReaction.comment_id == comment.id,
        )
        res = await db.execute(stmt)
        val = res.scalar_one_or_none()
        if val is True:
            user_reaction = "like"
        elif val is False:
            user_reaction = "dislike"

    return {
        "id": comment.id,
        "user_id": comment.user_id,
        "username": comment.user.username if comment.user else "Unknown",
        "content": comment.content,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "likes": likes,
        "dislikes": dislikes,
        "user_reaction": user_reaction,
        "replies": [],  # Заполним ниже если нужно
    }


@app.get("/lessons/{lesson_id}/comments")
async def get_lesson_comments(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Загружаем корневые комментарии + пользователи + ответы + пользователи ответов
    result = await db.execute(
        select(Comment)
        .where(Comment.lesson_id == lesson_id, Comment.parent_id.is_(None))
        .options(
            selectinload(Comment.user),
            selectinload(Comment.replies).selectinload(Comment.user),
        )
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()

    # Форматируем с реакциями
    formatted = []
    for c in comments:
        c_data = await format_comment_with_stats(c, db, current_user)
        # Обрабатываем ответы
        for r in c.replies:
            r_data = await format_comment_with_stats(r, db, current_user)
            c_data["replies"].append(r_data)
        formatted.append(c_data)

    return formatted


@app.get("/articles/{article_id}/comments")
async def get_article_comments(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    result = await db.execute(
        select(Comment)
        .where(Comment.article_id == article_id, Comment.parent_id.is_(None))
        .options(
            selectinload(Comment.user),
            selectinload(Comment.replies).selectinload(Comment.user),
        )
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()

    formatted = []
    for c in comments:
        c_data = await format_comment_with_stats(c, db, current_user)
        for r in c.replies:
            r_data = await format_comment_with_stats(r, db, current_user)
            c_data["replies"].append(r_data)
        formatted.append(c_data)

    return formatted


# 📤 Добавить комментарий (исправленная версия)
@app.post("/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def create_comment(
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Получаем lesson_id или article_id из тела запроса
    lesson_id = data.lesson_id if hasattr(data, "lesson_id") else None
    article_id = data.article_id if hasattr(data, "article_id") else None

    if (lesson_id is None) == (article_id is None):
        raise HTTPException(
            status_code=400, detail="Specify either lesson_id or article_id"
        )

    # Проверяем существование объекта
    if lesson_id:
        obj = await db.get(EgeLesson, lesson_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Lesson not found")
    else:
        obj = await db.get(Article, article_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Article not found")

    # Если это ответ — проверяем родительский комментарий
    if data.parent_id:
        parent = await db.get(Comment, data.parent_id)
        if not parent or (
            parent.lesson_id != lesson_id and parent.article_id != article_id
        ):
            raise HTTPException(status_code=400, detail="Invalid parent comment")

    # Создаём комментарий
    comment = Comment(
        user_id=current_user.id,
        lesson_id=lesson_id,
        article_id=article_id,
        content=data.content,
        parent_id=data.parent_id,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)  # ✅ refresh подгружает id и created_at

    # ✅ Возвращаем без nested replies (они пустые при создании)
    return CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        username=current_user.username,  # ✅ Берём из current_user, не из comment.user
        content=comment.content,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
        replies=[],  # ✅ Пустой список, чтобы не триггерить lazy load
    )


# ✏️ Обновить комментарий


# ✏️ Обновить комментарий (только автор)
@app.patch("/comments/{comment_id}", response_model=CommentOut)
async def update_comment(
    comment_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ✅ Загружаем комментарий с пользователем
    result = await db.execute(
        select(Comment)
        .where(Comment.id == comment_id)
        .options(selectinload(Comment.user))  # ✅ Явно загружаем user
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    comment.content = data.content
    comment.updated_at = datetime.now()
    await db.commit()
    await db.refresh(comment)

    # ✅ Берём username из загруженного user или из current_user
    return CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        username=comment.user.username if comment.user else current_user.username,
        content=comment.content,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
        replies=[],
    )


# 🏥 HEALTH CHECK
# ============================================================================


@app.get("/health")
async def health():
    return {"status": "ok", "db": "postgresql_asyncpg"}
