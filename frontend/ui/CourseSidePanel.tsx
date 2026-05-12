"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Trophy,
  Lock,
  X,
} from "lucide-react";
import useContactStore from "@/store/states";

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
  is_locked?: boolean;
};

type CourseResponse = {
  lessons: Lesson[];
  units: CourseUnit[];
  completion_percent: number | null;
  is_enrolled: boolean;
};

export default function CourseSidePanel() {
  const params = useParams();
  const pathname = usePathname();
  const slug = params.slug as string;

  const { coursenavigationState, togglecourseNavigation } = useContactStore();
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set([1]));
  const [completionPercent, setCompletionPercent] = useState<number | null>(
    null,
  );

  // Get current lesson slug from pathname
  const currentLessonSlug = pathname?.split("/").pop();

  // Memoize the check for sidepanel visibility
  const shouldShowSidepanel = useCallback(() => {
    if (!pathname) return false;
    const segments = pathname.split("/").filter(Boolean);
    return segments.length >= 3;
  }, [pathname]);

  // Handle animation on open/close
  useEffect(() => {
    const showPanel = shouldShowSidepanel();

    if (!showPanel) {
      // If we're not on a lesson page, close the panel if it's open
      if (coursenavigationState) {
        togglecourseNavigation();
      }
      return;
    }

    if (coursenavigationState) {
      setShouldRender(true);
      setIsAnimatingOut(false);
      setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
    } else if (shouldRender) {
      setIsAnimatingIn(false);
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimatingOut(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    coursenavigationState,
    shouldRender,
    shouldShowSidepanel,
    togglecourseNavigation,
  ]);

  // Extract course slug from pathname if not in params
  const getCourseSlug = useCallback(() => {
    if (slug) return slug;
    const match = pathname?.match(/\/courses\/([^\/]+)/);
    return match ? match[1] : null;
  }, [slug, pathname]);

  const courseSlug = getCourseSlug();

  useEffect(() => {
    async function fetchData() {
      if (!courseSlug) return;

      try {
        const data: CourseResponse = await apiFetch(`/courses/${courseSlug}`);
        console.log("🔍 [Frontend] Received course ", {
          is_enrolled: data.is_enrolled,
          lessonsCount: data.lessons.length,
          lockedLessons: data.lessons.filter((l: any) => l.is_locked).length,
        });

        console.log(
          "🔍 [Frontend] Lessons:",
          data.lessons.map((l: any) => ({
            title: l.title,
            is_locked: l.is_locked,
          })),
        );

        if (!data || !data.lessons) {
          return;
        }

        const token = localStorage.getItem("token");
        const processedLessons: Lesson[] = [];

        for (const lesson of data.lessons) {
          let isCompleted = false;

          if (token && lesson.test_id) {
            try {
              const result = await apiFetch(`/tests/${lesson.test_id}/result`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
              });
              if (data.completion_percent !== undefined) {
                setCompletionPercent(data.completion_percent);
              }

              if (result?.score !== undefined && result.score >= 75) {
                isCompleted = true;

                const token = localStorage.getItem("token");
                if (token && lesson.id) {
                  apiFetch(`/lessons/${lesson.id}/complete`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                  }).catch(() => {});
                }
              } else {
              }
            } catch (err) {
              isCompleted = false;
            }
          }

          processedLessons.push({ ...lesson, is_completed: isCompleted });
        }

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

        const subjects = await apiFetch("/courses/subjects");
        const current = subjects.find((s: any) => s.slug === courseSlug);
        if (current) {
          setCourseTitle(current.title);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (courseSlug && coursenavigationState && shouldShowSidepanel()) {
      fetchData();
    }
  }, [courseSlug, coursenavigationState, shouldShowSidepanel]);

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

  const handleClose = () => {
    togglecourseNavigation();
  };

  // Don't show button or panel if not on lesson page
  if (!shouldShowSidepanel()) {
    return null;
  }

  if (!shouldRender) {
    return (
      <button
        onClick={togglecourseNavigation}
        className="w-[40px] h-[40px] items-center justify-center flex rounded-lg bg-gray-200 text-gray-500 absolute top-0 left-0 z-50 hover:bg-gray-300 transition-colors"
      >
        <ChevronRight />
      </button>
    );
  }

  return (
    <div
      className={`h-full rounded-lg flex-1 bg-white rounded-lg p-[10px] max-w-[240px] w-full transition-transform duration-300 ${
        isAnimatingOut
          ? "-translate-x-full"
          : isAnimatingIn
            ? "translate-x-0"
            : "-translate-x-full"
      }`}
    >
      <div className="rounded-lg border-b border-gray-200 flex items-center justify-between z-10">
        <h2 className="text-sm font-semibold text-gray-500">
          Содержание курса
        </h2>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="h-full overflow-y-auto pb-20">
        <div className="">
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
            <div className="space-y-4">
              {unitsWithProgress.map((unit) => {
                const unitLessons = lessonsByUnit[unit.id] || [];
                const isExpanded = expandedUnits.has(unit.id);

                // Auto-expand unit that contains current lesson
                const hasCurrentLesson = unitLessons.some(
                  (lesson) => lesson.slug === currentLessonSlug,
                );
                const shouldAutoExpand = hasCurrentLesson && !isExpanded;

                // Auto-expand if needed
                if (shouldAutoExpand && coursenavigationState) {
                  setTimeout(() => {
                    if (!expandedUnits.has(unit.id)) {
                      toggleUnit(unit.id);
                    }
                  }, 100);
                }

                return (
                  <div key={unit.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleUnit(unit.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div className="flex flex-row flex-wrap items-baseline gap-1">
                            {unit.unit_number > 0 && (
                              <span className="text-sm font-semibold text-gray-900">
                                Unit {unit.unit_number} —
                              </span>
                            )}
                            <h4
                              className={`text-sm font-semibold text-gray-900`}
                            >
                              {unit.title}
                            </h4>
                          </div>
                          {unit.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {unit.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {unitLessons.length}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-3">
                        {unitLessons.map((lesson) =>
                          lesson.is_locked ? (
                            <div
                              key={lesson.id}
                              className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-60 cursor-not-allowed"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <h5 className="text-sm font-medium text-gray-500 truncate">
                                    {lesson.title}
                                  </h5>
                                </div>
                              </div>
                              {lesson.time_minutes && (
                                <div className="flex items-center gap-1 text-gray-400 text-xs whitespace-nowrap flex-shrink-0">
                                  <Clock className="w-3 h-3" />
                                  <span>{lesson.time_minutes} мин</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Link
                              key={lesson.id}
                              href={`/courses/${courseSlug}/${lesson.slug}`}
                              onClick={handleClose}
                              className={`group block p-3 rounded-lg border transition-all relative ${
                                lesson.slug === currentLessonSlug
                                  ? "bg-purple-50 border-purple-400 shadow-sm"
                                  : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm"
                              }`}
                            >
                              {lesson.is_completed === true && (
                                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-300">
                                  <svg
                                    className="w-2.5 h-2.5"
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

                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0 pr-12">
                                  <h5
                                    className={`text-sm font-semibold line-clamp-2 ${
                                      lesson.slug === currentLessonSlug
                                        ? "text-purple-700"
                                        : "text-gray-900 group-hover:text-purple-700"
                                    }`}
                                  >
                                    {lesson.title}
                                  </h5>
                                  {lesson.description && (
                                    <p className="text-gray-600 mt-0.5 text-xs line-clamp-1">
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>
                                {lesson.time_minutes && (
                                  <div className="flex items-center gap-1 text-gray-500 text-xs whitespace-nowrap flex-shrink-0">
                                    <Clock className="w-3 h-3" />
                                    <span>{lesson.time_minutes}</span>
                                  </div>
                                )}
                              </div>
                            </Link>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
