// frontend/app/courses/promo/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  Star,
  Users,
  MessageSquare,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type PromoCourse = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  category: string | null;
  is_favorite: boolean;
  duration_minutes: number | null;
  certificate_available: boolean;
  enrolled_count?: number;
  rating?: number | null;
};

type Review = {
  id: number;
  username: string;
  avatar_url: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

type ReviewStats = {
  average_rating: number;
  total_reviews: number;
  user_review: Review | null;
};

export default function CoursePromoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [course, setCourse] = useState<PromoCourse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 [Promo] Fetching course data for slug:", slug);

        // 1️⃣ Загружаем список курсов
        const courses = await apiFetch("/courses/subjects");
        const found = courses.find((c: any) => c.slug === slug);

        console.log(
          "🔍 [Promo] Found course:",
          found ? { id: found.id, title: found.title } : "NOT FOUND",
        );

        if (found) {
          setCourse(found);

          // 2️⃣ Проверяем запись (используем slug для enroll, id для reviews)
          const token = localStorage.getItem("token");
          if (token) {
            try {
              const courseData = await apiFetch(`/courses/${slug}`);
              setIsEnrolled(courseData.is_enrolled || false);
            } catch (err) {
              console.warn("⚠️ Could not check enrollment:", err);
            }
          }

          // 3️⃣ Загружаем отзывы — ТОЛЬКО если id определён
          if (found.id) {
            try {
              const reviewsData = await apiFetch(
                `/courses/${found.id}/reviews`,
              );
              setReviews(reviewsData.reviews || []);
              setReviewStats(reviewsData.stats || null);
            } catch (err) {
              console.warn("⚠️ Could not load reviews:", err);
            }
          }
        }
      } catch (err) {
        console.error("❌ Failed to load promo:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  const handleEnroll = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // 🔥 Используем slug для enroll (как в других эндпоинтах)
    if (!course?.slug) {
      console.error("❌ Course slug is missing");
      return;
    }

    setEnrolling(true);
    try {
      console.log("🔍 [Enroll] POST /courses/${course.slug}/enroll");
      await apiFetch(`/courses/${course.slug}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsEnrolled(true);
      setTimeout(() => router.push(`/courses/${slug}`), 1000);
    } catch (err: any) {
      console.error("❌ Failed to enroll:", err);
      alert(err.message || "Ошибка при записи");
    } finally {
      setEnrolling(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (!course?.id) {
      console.error("❌ Course ID is missing");
      return;
    }

    // 🔥 Валидация: минимум 50 слов
    const words = newReview.comment
      .trim()
      .split(/\s+/)
      .filter((w) => w);
    const wordCount = words.length;

    console.log("🔍 [Review] Word count:", wordCount, "/ 50");

    if (wordCount < 50) {
      setCommentError(`Минимум 50 слов. Сейчас: ${wordCount}`);
      return;
    }
    setCommentError(null);

    setSubmittingReview(true);
    try {
      console.log("🔍 [Review] POST /courses/${course.id}/reviews");
      await apiFetch(`/courses/${course.id}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: newReview.rating,
          comment: newReview.comment.trim(),
        }),
      });

      // Перезагружаем отзывы
      const reviewsData = await apiFetch(`/courses/${course.id}/reviews`);
      setReviews(reviewsData.reviews || []);
      setReviewStats(reviewsData.stats || null);
      setNewReview({ rating: 5, comment: "" });
    } catch (err: any) {
      console.error("❌ Failed to submit review:", err);
      alert(err.message || "Ошибка при отправке отзыва");
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (!course?.id) return;

    try {
      const isFav = course.is_favorite;
      await apiFetch(`/courses/${course.id}/favorite`, {
        method: isFav ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourse((prev) => (prev ? { ...prev, is_favorite: !isFav } : prev));
    } catch (err) {
      console.error("❌ Failed to toggle favorite:", err);
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onChange?: (r: number) => void,
  ) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          onClick={interactive && onChange ? () => onChange(star) : undefined}
          disabled={!interactive}
          className={interactive ? "p-0.5 hover:scale-110 transition" : ""}
        >
          <Star
            className={`w-5 h-5 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} ${interactive ? "cursor-pointer" : ""}`}
          />
        </button>
      ))}
    </div>
  );

  // 🔥 Отладка: показываем состояние
  useEffect(() => {
    console.log(
      "🔍 [Render] course:",
      course ? { id: course.id, slug: course.slug } : null,
    );
    console.log("🔍 [Render] isEnrolled:", isEnrolled);
    console.log("🔍 [Render] reviewStats:", reviewStats);
  }, [course, isEnrolled, reviewStats]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  if (!course) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-600 text-lg mb-4">Курс не найден</p>
        <Link
          href="/courses"
          className="text-purple-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться к курсам
        </Link>
      </main>
    );
  }

  // Подсчёт слов для отображения
  const wordCount = newReview.comment
    .trim()
    .split(/\s+/)
    .filter((w) => w).length;

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      <div className="w-full mb-6">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Все курсы
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full">
        {/* 🔹 Обложка + избранное */}
        <div className="relative">
          {course.image && (
            <div className="h-64 sm:h-80 bg-gray-100 overflow-hidden">
              <img
                src={`/${course.image}`}
                alt={course.title}
                className="w-full h-full object-cover"
                onError={(e) =>
                  (e.target as HTMLImageElement).parentElement?.classList.add(
                    "hidden",
                  )
                }
              />
            </div>
          )}
          <button
            onClick={toggleFavorite}
            className={`absolute top-4 right-4 z-10 p-3 rounded-full transition shadow-lg ${course.is_favorite ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white"}`}
            title={
              course.is_favorite
                ? "Убрать из избранного"
                : "Добавить в избранное"
            }
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill={course.is_favorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* 🔹 Контент */}
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-4">
            {course.category && (
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                {course.category}
              </span>
            )}
            {course.certificate_available && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                <Award className="w-3 h-3" /> Сертификат
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
              {course.description}
            </p>
          )}

          {/* 🔹 Мета-информация */}
          <div className="flex flex-wrap items-center gap-4 py-4 border-y border-gray-100 mb-6">
            {course.duration_minutes && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(course.duration_minutes)}</span>
              </div>
            )}
            {course.enrolled_count !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{course.enrolled_count}+ студентов</span>
              </div>
            )}
            {reviewStats?.average_rating != null && (
              <div className="flex items-center gap-2">
                {renderStars(Number(reviewStats.average_rating))}
                <span className="text-sm text-gray-600">
                  {/* 🔥 Преобразуем в число и проверяем */}
                  {Number(reviewStats.average_rating).toFixed(1)} (
                  {reviewStats.total_reviews || 0})
                </span>
              </div>
            )}
          </div>

          {/* 🔹 Кнопка записи — используем slug */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            {isEnrolled ? (
              <Link
                href={`/courses/${slug}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition shadow-md"
              >
                <CheckCircle className="w-5 h-5" /> Продолжить обучение
              </Link>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling || !course?.slug}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition shadow-md disabled:opacity-50"
              >
                <BookOpen className="w-5 h-5" />
                {enrolling ? "Записываем..." : "Записаться на курс"}
              </button>
            )}
            <p className="text-sm text-gray-500">
              {isEnrolled ? "Вы уже записаны" : "Бесплатно • Доступ навсегда"}
            </p>
          </div>
        </div>
      </div>

      {/* 🔹 Отзывы */}
      <div className="w-full mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Отзывы (
          {reviewStats?.total_reviews || 0})
        </h2>

        {/* Форма отзыва */}
        {!reviewStats?.user_review && (
          <form
            onSubmit={handleSubmitReview}
            className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200"
          >
            <p className="text-sm text-purple-800 mb-3 font-medium">
              Оцените курс:
            </p>
            <div className="mb-3">
              {renderStars(newReview.rating, true, (r) =>
                setNewReview((prev) => ({ ...prev, rating: r })),
              )}
            </div>
            <textarea
              value={newReview.comment}
              onChange={(e) =>
                setNewReview((prev) => ({ ...prev, comment: e.target.value }))
              }
              placeholder="Напишите ваш отзыв (минимум 50 слов)..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              rows={4}
            />
            <div className="flex justify-between items-center mt-2">
              <p
                className={`text-xs ${commentError ? "text-red-600" : "text-gray-500"}`}
              >
                {commentError || `${wordCount}/50 слов`}
              </p>
              <button
                type="submit"
                disabled={submittingReview || wordCount < 50 || !course?.id}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50"
              >
                {submittingReview ? "Отправка..." : "Оставить отзыв"}
              </button>
            </div>
          </form>
        )}

        {/* Если уже оставил отзыв */}
        {reviewStats?.user_review && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-sm text-green-800 font-medium mb-2">
              Ваш отзыв:
            </p>
            <div className="flex items-start gap-3">
              {renderStars(reviewStats.user_review.rating)}
              <p className="text-gray-700 text-sm">
                {reviewStats.user_review.comment}
              </p>
            </div>
          </div>
        )}

        {/* Список отзывов */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Пока нет отзывов. Будьте первым! ✨
            </p>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 border border-gray-200 rounded-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
                      {review.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {review.username}
                      </p>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <p className="text-gray-700 mt-3 text-sm whitespace-pre-wrap">
                  {review.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
