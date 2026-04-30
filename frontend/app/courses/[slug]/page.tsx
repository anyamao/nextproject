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
  ChevronDown,
  ChevronUp,
  Trophy,
} from "lucide-react";

type CourseUnit = {
  id: number;
  title: string;
  unit_number: number;
  description: string | null;
  lesson_count: number;
  progress?: { completed: number; total: number; percent: number } | null;
};

type Lesson = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  time_minutes: number | null;
  test_id?: number | null;
  unit: CourseUnit | null;
  is_completed?: boolean;
};

type CourseResponse = {
  lessons: Lesson[];
  units: CourseUnit[];
};

export default function CourseLessonsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
    async function fetchData() {
      try {
        console.log(`🔍 [CoursesPage] Fetching /courses/${slug}...`);

        const data: CourseResponse = await apiFetch(`/courses/${slug}`);
        if (!data) {
          console.error("❌ [CoursesPage] Response is null");
          return;
        }

        let lessonsData = data.lessons || [];
        const unitsData = data.units || [];

        // 🔥 КЛИЕНТСКИЙ РАСЧЁТ: загружаем результаты тестов
        const token = localStorage.getItem("token");
        if (token) {
          console.log("🔍 [CoursesPage] Fetching test results for progress...");

          const lessonsWithTests = lessonsData.filter((l) => l.test_id);
          console.log(
            `🔍 [CoursesPage] Found ${lessonsWithTests.length} lessons with tests`,
          );

          const results = await Promise.all(
            lessonsWithTests.map(async (lesson) => {
              try {
                const result = await apiFetch(
                  `/tests/${lesson.test_id}/result`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                  },
                );

                if (result?.passed === true && result?.score >= 75) {
                  console.log(
                    `✅ [CoursesPage] Lesson ${lesson.id} completed (score: ${result.score}%)`,
                  );
                  return { ...lesson, is_completed: true };
                }
                return lesson;
              } catch (err) {
                return lesson;
              }
            }),
          );

          lessonsData = lessonsData.map((lesson) => {
            const updated = results.find((r) => r.id === lesson.id);
            return updated || lesson;
          });
        }

        setLessons(lessonsData);
        setUnits(unitsData);

        // Название курса
        const subjects = await apiFetch("/courses/subjects");
        const current = subjects.find((s: any) => s.slug === slug);
        if (current) {
          setCourseTitle(current.title);
          document.title = `${current.title} — Курсы | MaoSchool`;
        }
      } catch (err) {
        console.error("❌ [CoursesPage] Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const toggleUnit = (unitId: number) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  // Группируем уроки по юнитам
  const lessonsByUnit = lessons.reduce(
    (acc, lesson) => {
      const unitId = lesson.unit?.id ?? 0;
      if (!acc[unitId]) acc[unitId] = [];
      acc[unitId].push(lesson);
      return acc;
    },
    {} as Record<number, Lesson[]>,
  );

  // 🔥 Прогресс по урокам внутри юнитов (для отображения внутри юнита)
  const unitsWithProgress = units.map((unit) => {
    const unitLessons = lessonsByUnit[unit.id] || [];
    const lessonsWithTests = unitLessons.filter((l) => l.test_id);

    if (lessonsWithTests.length === 0) {
      return { ...unit, progress: null };
    }

    const completed = unitLessons.filter((l) => l.is_completed).length;
    const total = lessonsWithTests.length;
    const percent = Math.round((completed / total) * 100);

    return { ...unit, progress: { completed, total, percent } };
  });

  // 🔥🔥 ПРОГРЕСС ПО ЮНИТАМ (для верхней полоски)
  // Юнит считается пройденным, если ВСЕ уроки с тестами в нём пройдены
  const totalUnits = units.length;
  const completedUnits = units.filter((unit) => {
    const unitLessons = lessonsByUnit[unit.id] || [];
    const lessonsWithTests = unitLessons.filter((l) => l.test_id);

    // Если в юните нет уроков с тестами — считаем его "автоматически пройденным"
    if (lessonsWithTests.length === 0) return true;

    // Иначе: все уроки с тестами должны быть пройдены
    return lessonsWithTests.every((l) => l.is_completed);
  }).length;

  const unitProgressPercent =
    totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      {/* 🔝 Заголовок + ПОЛОСКА ПРОГРЕССА ПО ЮНИТАМ */}
      <div className="w-full mb-8">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-5 h-5" /> Все курсы
        </Link>

        {/* 🟣 ПОЛОСКА ПРОГРЕССА ПО ЮНИТАМ (как в ЕГЭ) */}
        <div className="mb-4 rounded-xl">
          <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
            <span className="font-medium flex items-center gap-2">
              Прогресс по курсу
            </span>
            <span className="text-gray-500">
              {completedUnits}/{totalUnits}{" "}
              {completedUnits == 0 ||
              completedUnits / 10 == 0 ||
              (completedUnits >= 5 && completedUnits <= 20) ||
              completedUnits % 10 >= 5
                ? "юнитов"
                : completedUnits == 1
                  ? "юнит"
                  : "юнита"}
              {totalUnits % 10 === 1 && totalUnits % 100 !== 11
                ? ""
                : totalUnits % 10 >= 2 &&
                    totalUnits % 10 <= 4 &&
                    (totalUnits % 100 < 10 || totalUnits % 100 >= 20)
                  ? "а"
                  : "ов"}{" "}
              пройдено
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={` rounded-full h-2 transition-all duration-700 ease-out ${
                unitProgressPercent === 100
                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                  : "bg-gradient-to-r from-purple-500 to-indigo-600"
              }`}
              style={{ width: `${unitProgressPercent}%` }}
            />
          </div>

          {unitProgressPercent === 100 && (
            <p className="text-center text-sm text-green-700 font-medium mt-2 flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4" /> Курс завершён! 🎉
            </p>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          {courseTitle || "Загрузка..."}
        </h1>
        <p className="text-gray-600 mt-2">Выберите урок для начала обучения</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      ) : !lessons.length ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Уроки пока не добавлены</p>
        </div>
      ) : (
        <div className="w-full space-y-6">
          {unitsWithProgress.map((unit) => {
            const unitLessons = lessonsByUnit[unit.id] || [];
            const isExpanded = expandedUnits.has(unit.id);

            // 🔥 Определяем, пройден ли юнит (для визуального индикатора)
            const lessonsWithTests = unitLessons.filter((l) => l.test_id);
            const isUnitCompleted =
              lessonsWithTests.length === 0
                ? true
                : lessonsWithTests.every((l) => l.is_completed);

            return (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                {/* Прогресс внутри юнита */}
                {unit.progress && (
                  <div className="mt-3 flex items-center gap-3 px-4">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          unit.progress.percent === 100
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : "bg-gradient-to-r from-purple-400 to-indigo-500"
                        }`}
                        style={{ width: `${unit.progress.percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                      {unit.progress.completed}/{unit.progress.total}
                    </span>
                  </div>
                )}

                {/* Заголовок юнита */}
                <button
                  onClick={() => toggleUnit(unit.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    {/* ✅ Индикатор пройденного юнита */}
                    <div
                      className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shadow-md ${
                        isUnitCompleted
                          ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white"
                          : "bg-gradient-to-br from-purple-400 to-indigo-500 text-white"
                      }`}
                    >
                      {isUnitCompleted ? "✓" : unit.unit_number}
                    </div>

                    <div className="text-left">
                      <div className="flex flex-row">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Unit {unit.unit_number} -
                        </h2>
                        <h2 className="text-lg font-semibold ml-[3px] text-gray-900">
                          {unit.title}
                        </h2>
                      </div>
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

                {/* Уроки */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
                    {unitLessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${slug}/${lesson.slug}`}
                        className="group block p-4 bg-gray-50 rounded-xl relative border border-gray-200 hover:border-purple-300 hover:shadow-md hover:bg-white transition-all"
                      >
                        {/* Бейдж "Пройдено" */}
                        {lesson.is_completed && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-300 z-10">
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

          {/* Уроки без юнита */}
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
