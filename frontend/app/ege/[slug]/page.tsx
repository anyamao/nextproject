// frontend/app/ege/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, BookOpen, Lock } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Lesson = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  is_completed?: boolean;
  time_minutes: number | null;
};

type Subject = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
};

export default function SubjectLessonsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjectTitle, setSubjectTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false); // 🔥 Новый стейт

  useEffect(() => {
    async function fetchData() {
      try {
        // 1️⃣ Загружаем уроки предмета
        const lessonsData = await apiFetch(`/ege/${slug}`);
        setLessons(lessonsData);

        // 2️⃣ Загружаем все предметы и ищем нужный по slug
        const subjects: Subject[] = await apiFetch("/ege");
        const currentSubject = subjects.find((s) => s.slug === slug);

        if (currentSubject) {
          setSubjectTitle(currentSubject.title);
          document.title = `${currentSubject.title} — ЕГЭ Подготовка | MaoSchool`;
        } else {
          setSubjectTitle("Предмет не найден");
        }
      } catch (err: any) {
        // 🔥 ОБРАБОТКА 401: гостевой режим
        if (err?.status === 401) {
          console.log("ℹ️ [EGE] Guest mode: loading public content");
          setIsGuestMode(true);

          // 🔥 Пробуем загрузить публичную версию уроков (без is_completed)
          try {
            // Повторный запрос БЕЗ токена (на случай, если apiFetch добавил его)
            const publicLessons = await apiFetch(`/ege/${slug}`);
            // Убираем is_completed, так как гость не может видеть прогресс
            const sanitized = publicLessons.map((l: Lesson) => {
              const { is_completed, ...rest } = l;
              return rest;
            });
            setLessons(sanitized);

            // Загружаем название предмета
            const subjects: Subject[] = await apiFetch("/ege");
            const current = subjects.find((s) => s.slug === slug);
            if (current) {
              setSubjectTitle(current.title);
              document.title = `${current.title} — ЕГЭ Подготовка | MaoSchool`;
            }
          } catch (fallbackErr) {
            console.error(
              "❌ [EGE] Failed to load public content:",
              fallbackErr,
            );
            setError("Не удалось загрузить публичный контент");
          }
        } else {
          // 🔥 Другие ошибки — показываем как раньше
          console.error("❌ [EGE] Failed to fetch:", err);
          setError("Не удалось загрузить данные");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // Подсчёт прогресса (только если не гость)
  const totalLessons = lessons.length;
  const completedLessons = isGuestMode
    ? 0 // Гость не видит прогресс
    : lessons.filter((lesson) => lesson.is_completed).length;

  const progressPercentage =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <Link
          href="/ege"
          className="text-purple-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться к предметам
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      <div className="w-full mb-8">
        <Link
          href="/ege"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Все предметы</span>
        </Link>

        {/* 🔥 Индикатор гостевого режима */}
        {isGuestMode && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
            <Lock className="w-4 h-4" />
            <span>
              <strong>Гостевой режим</strong> •
              <Link
                href="/auth/login"
                className="underline hover:text-yellow-900 ml-1"
              >
                Войдите для отслеживания прогресса
              </Link>
            </span>
          </div>
        )}

        {/* Прогресс-бар */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Прогресс по предмету</span>
            <span className="text-gray-500">
              {isGuestMode ? (
                "Войдите, чтобы видеть прогресс"
              ) : (
                <>
                  {completedLessons}/{totalLessons}{" "}
                  {completedLessons == 0 ||
                  completedLessons / 10 == 0 ||
                  (completedLessons >= 5 && completedLessons <= 20) ||
                  completedLessons % 10 >= 5
                    ? "уроков пройдено"
                    : completedLessons == 1
                      ? "урок пройден"
                      : "урока пройдено"}
                </>
              )}
            </span>
          </div>

          {totalLessons > 0 ? (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isGuestMode ? "bg-gray-400" : "bg-purple-600"
                }`}
                style={{ width: isGuestMode ? "0%" : `${progressPercentage}%` }}
              />
            </div>
          ) : (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gray-400 h-2 rounded-full"
                style={{ width: "0%" }}
              />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 capitalize">
          {subjectTitle}
        </h1>
        <p className="text-gray-600 mt-2">Выберите урок для начала обучения</p>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Уроки пока не добавлены
          </h3>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/ege/${slug}/${lesson.slug}`}
              className="block p-5 bg-white rounded-xl relative border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
            >
              {/* 🔥 Бейдж "Пройдено" только для авторизованных */}
              {!isGuestMode && lesson.is_completed && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-300">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Пройдено</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {lesson.title}
                  </h3>
                  {lesson.description && (
                    <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                      {lesson.description}
                    </p>
                  )}
                </div>
                {lesson.time_minutes && (
                  <div className="flex items-center gap-1 text-gray-500 text-sm whitespace-nowrap">
                    <Clock className="w-4 h-4" />
                    <span>{lesson.time_minutes} мин</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
