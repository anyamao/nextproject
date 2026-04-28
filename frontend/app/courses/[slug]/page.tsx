// frontend/app/courses/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Lesson = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  time_minutes: number | null;
};

type Course = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
};

export default function CourseLessonsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1️⃣ Загружаем уроки курса (этот эндпоинт точно есть!)
        const lessonsData = await apiFetch(`/courses/${slug}`);
        setLessons(lessonsData);

        // 2️⃣ Пытаемся загрузить список курсов для получения названия
        // ✅ ИСПРАВЛЕНО: /courses/subjects вместо /courses
        try {
          const courses: Course[] = await apiFetch("/courses/subjects");
          const currentCourse = courses.find((c) => c.slug === slug);

          if (currentCourse) {
            setCourseTitle(currentCourse.title);
            document.title = `${currentCourse.title} — Курсы | MaoSchool`;
          } else {
            // Курс не найден в списке — фолбэк на slug
            setCourseTitle(slug.replace(/-/g, " "));
          }
        } catch (listErr) {
          // ✅ Фолбэк: если эндпоинт не доступен — используем slug
          console.log(
            "ℹ️ /courses/subjects not available, using slug as fallback",
          );
          setCourseTitle(slug.replace(/-/g, " "));
        }
      } catch (err: any) {
        console.error("Failed to fetch ", err);
        setError(err?.message || "Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

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
        <Link href="/courses" className="text-purple-600 hover:underline">
          ← Вернуться к курсам
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      <div className="w-full mb-8">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Все курсы</span>
        </Link>

        {/* ✅ Показываем название курса или фолбэк на slug */}
        <h1 className="text-3xl font-bold text-gray-900 capitalize">
          {courseTitle || slug.replace(/-/g, " ")}
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
              href={`/courses/${slug}/${lesson.slug}`}
              prefetch={false}
              className="block p-5 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
            >
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
