// frontend/app/courses/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Folder,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type CourseUnit = {
  id: number;
  title: string; // "My Friends and Me"
  unit_number: number; // 1
  description: string | null;
  lesson_count: number;
};

type Lesson = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  time_minutes: number | null;
  unit: CourseUnit | null; // ✅ Юнит урока
};

type CourseResponse = {
  lessons: Lesson[];
  units: CourseUnit[];
};

export default function CourseLessonsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [response, setResponse] = useState<CourseResponse | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // 🔓 Состояние: какие юниты раскрыты
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set([1])); // По умолчанию раскрыт первый

  useEffect(() => {
    async function fetchData() {
      try {
        const data: CourseResponse = await apiFetch(`/courses/${slug}`);
        setResponse(data);

        // Название курса
        const courses = await apiFetch("/courses/subjects");
        const current = courses.find((c: any) => c.slug === slug);
        if (current) {
          setCourseTitle(current.title);
          document.title = `${current.title} — Курсы | MaoSchool`;
        }
      } catch (err) {
        console.error("Failed to fetch", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // 🔓 Переключение раскрытия юнита
  const toggleUnit = (unitId: number) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  // Группируем уроки по юнитам
  const lessonsByUnit = response?.lessons.reduce(
    (acc, lesson) => {
      const unitId = lesson.unit?.id ?? 0; // 0 для уроков без юнита
      if (!acc[unitId]) acc[unitId] = [];
      acc[unitId].push(lesson);
      return acc;
    },
    {} as Record<number, Lesson[]>,
  );

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      {/* 🔝 Заголовок */}
      <div className="w-full mb-8">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-5 h-5" /> Все курсы
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {courseTitle || "Загрузка..."}
        </h1>
        <p className="text-gray-600 mt-2">Выберите урок для начала обучения</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      ) : !response?.lessons.length ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Уроки пока не добавлены</p>
        </div>
      ) : (
        <div className="w-full space-y-6">
          {/* 📦 Рендерим каждый юнит как аккордеон */}
          {response.units.map((unit) => {
            const unitLessons = lessonsByUnit[unit.id] || [];
            const isExpanded = expandedUnits.has(unit.id);

            return (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                {/* 🏷️ Заголовок юнита (кликабельный) */}
                <button
                  onClick={() => toggleUnit(unit.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {unit.unit_number}
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {unit.title}
                      </h2>
                      {unit.description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {unit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {unitLessons.length} урок
                      {unitLessons.length % 10 === 1 &&
                      unitLessons.length % 100 !== 11
                        ? ""
                        : unitLessons.length % 10 >= 2 &&
                            unitLessons.length % 10 <= 4 &&
                            (unitLessons.length % 100 < 10 ||
                              unitLessons.length % 100 >= 20)
                          ? "а"
                          : "ов"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* 📚 Список уроков (раскрывается) */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
                    {unitLessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${slug}/${lesson.slug}`}
                        className="group block p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md hover:bg-white transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-700">
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
              </div>
            );
          })}

          {/* 📦 Уроки без юнита (если есть) */}
          {lessonsByUnit[0]?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Дополнительные материалы
              </h2>
              <div className="space-y-3">
                {lessonsByUnit[0].map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/courses/${slug}/${lesson.slug}`}
                    className="group block p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-700">
                      {lesson.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
