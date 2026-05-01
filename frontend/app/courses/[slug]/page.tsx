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
        // 🔥 FIX: переменная data с типом CourseResponse
        const data: CourseResponse = await apiFetch(`/courses/${slug}`);

        if (!data || !data.lessons) {
          console.error("❌ [CoursesPage] Invalid response");
          return;
        }

        const token = localStorage.getItem("token");
        const processedLessons: Lesson[] = [];

        // 🔥 Обрабатываем каждый урок ПО ОТДЕЛЬНОСТИ
        for (const lesson of data.lessons) {
          let isCompleted = false; // По умолчанию — НЕ пройден

          // 🔥 Только если есть тест И пользователь авторизован — проверяем результат
          if (token && lesson.test_id) {
            try {
              const result = await apiFetch(`/tests/${lesson.test_id}/result`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
              });
              // 🔥 ЕДИНСТВЕННОЕ условие для is_completed: score >= 75
              if (result?.score !== undefined && result.score >= 75) {
                isCompleted = true;
                console.log(
                  `✅ Lesson ${lesson.id} "${lesson.title}": score=${result.score} → COMPLETED`,
                );
              } else {
                console.log(
                  `⚠️ Lesson ${lesson.id} "${lesson.title}": score=${result?.score ?? "N/A"} → NOT completed`,
                );
              }
            } catch (err) {
              console.warn(
                `⚠️ Could not fetch test result for lesson ${lesson.id}`,
              );
              isCompleted = false;
            }
          } else if (!lesson.test_id) {
            // 🔥 Урок без теста — НИКОГДА не считается пройденным
            console.log(
              `ℹ️ Lesson ${lesson.id} "${lesson.title}": no test → NOT completed`,
            );
          }

          // 🔥 Явно создаём новый объект с правильным is_completed
          processedLessons.push({ ...lesson, is_completed: isCompleted });
        }

        // 🔥 Лог ПЕРЕД рендером — показывает РЕАЛЬНЫЕ значения
        console.log(
          "🎨 [CoursesPage] Final lessons (REAL values):",
          processedLessons.map((l) => ({
            id: l.id,
            title: l.title,
            test_id: l.test_id,
            is_completed: l.is_completed,
          })),
        );

        // Создаём виртуальные юниты для уроков без unit
        const rawUnits = data.units || [];
        const virtualUnits: CourseUnit[] = [];

        const finalLessons = processedLessons.map((lesson) => {
          if (!lesson.unit) {
            const vUnit: CourseUnit = {
              id: 1000000 + lesson.id,
              title: lesson.title,
              unit_number: 0,
              description: null,
              lesson_count: 1,
              progress: null,
            };
            virtualUnits.push(vUnit);
            return { ...lesson, unit: vUnit };
          }
          return lesson;
        });

        setLessons(finalLessons);
        setUnits([...rawUnits, ...virtualUnits]);

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

    if (slug) fetchData();
  }, [slug]);

  const toggleUnit = (unitId: number) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const lessonsByUnit = lessons.reduce(
    (acc, lesson) => {
      const unitId = lesson.unit?.id ?? 0;
      if (!acc[unitId]) acc[unitId] = [];
      acc[unitId].push(lesson);
      return acc;
    },
    {} as Record<number, Lesson[]>,
  );

  const unitsWithProgress = units.map((unit) => {
    const unitLessons = lessonsByUnit[unit.id] || [];
    const lessonsWithTests = unitLessons.filter((l) => l.test_id);

    if (lessonsWithTests.length === 0) return { ...unit, progress: null };

    const completed = unitLessons.filter((l) => l.is_completed === true).length;
    const total = lessonsWithTests.length;
    const percent = Math.round((completed / total) * 100);

    return { ...unit, progress: { completed, total, percent } };
  });

  const totalUnits = units.length;
  const completedUnits = units.filter((unit) => {
    const unitLessons = lessonsByUnit[unit.id] || [];
    const lessonsWithTests = unitLessons.filter((l) => l.test_id);
    if (lessonsWithTests.length === 0) return false;
    return lessonsWithTests.every((l) => l.is_completed === true);
  }).length;

  const unitProgressPercent =
    totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      <div className="w-full mb-8">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-5 h-5" /> Все курсы
        </Link>

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
              className={`rounded-full h-2 transition-all duration-700 ease-out ${
                unitProgressPercent === 100 ? "bg-green-500" : "bg-purple-500"
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
            const lessonsWithTests = unitLessons.filter((l) => l.test_id);
            const isUnitCompleted =
              lessonsWithTests.length === 0
                ? false
                : lessonsWithTests.every((l) => l.is_completed === true);

            return (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                {unit.progress && (
                  <div className="mt-3 flex items-center gap-3 px-4">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          unit.progress.percent === 100
                            ? "bg-green-400"
                            : "bg-purple-400 "
                        }`}
                        style={{ width: `${unit.progress.percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                      {unit.progress.completed}/{unit.progress.total}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => toggleUnit(unit.id)}
                  className="w-full flex items-center justify-between p-5 px-[20px] hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4 ">
                    <div className="text-left">
                      <div className="flex flex-row">
                        {unit.unit_number > 0 && (
                          <h2 className="text-lg font-semibold text-gray-900">
                            Unit {unit.unit_number} -
                          </h2>
                        )}
                        <h2
                          className={`text-lg font-semibold ${unit.unit_number > 0 ? "ml-[3px]" : ""} text-gray-900`}
                        >
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

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
                    {unitLessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${slug}/${lesson.slug}`}
                        className="group block p-4 bg-white shadow-xs relative rounded-xl  border border-gray-200 hover:border-purple-300 hover:shadow-sm hover:bg-white transition-all"
                      >
                        {lesson.is_completed === true && (
                          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-300 z-10">
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
        </div>
      )}
    </main>
  );
}
