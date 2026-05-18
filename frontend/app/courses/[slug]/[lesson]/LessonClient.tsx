"use client";

import useContactStore from "@/store/states";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Trophy,
  Lock,
  Clock,
  Star,
  NotebookPen,
  Check,
  Trash2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import LessonReactions from "@/components/LessonReactions";
import CommentsSection from "@/components/CommentsSection";
import CopyLinkButton from "@/components/LinkButton";
import { saveTestReturnUrl } from "@/lib/test-return";
import FlashcardSession from "@/components/FlashcardSession";
import { BookOpen } from "lucide-react";
import Toast from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

type Lesson = {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  unit?: {
    id: number;
    title: string;
  } | null;
  time_minutes: number | null;
};

type TestResult = {
  score: number;
  passed: boolean;
  completed_at: string;
  reward_granted?: boolean;
};

interface LessonClientProps {
  lesson: Lesson | null;
  subjectSlug: string;
  lessonSlug: string;
  testId: number | null;
  isLocked?: boolean;
}

export default function LessonClient({
  lesson,
  subjectSlug,
  lessonSlug,
  testId,
  isLocked = false,
}: LessonClientProps) {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    message?: string;
    title?: string;
  }>({
    isOpen: false,
    onConfirm: () => {},
    message: "",
    title: "",
  });

  const [courseTitle, setCourseTitle] = useState<string>("");
  const [nextLessonSlug, setNextLessonSlug] = useState<string | null>(null);
  const [lessonsLoaded, setLessonsLoaded] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcardStats, setFlashcardStats] = useState<any>(null);
  const { openLogin } = useContactStore();

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
  };

  const [unitLessons, setUnitLessons] = useState<
    Array<{
      id: number;
      slug: string;
      title: string;
      test_id: number | null;
      is_completed?: boolean;
      unit?: {
        id: number;
        title: string;
      } | null;
    }>
  >([]);

  useEffect(() => {
    if (lesson?.id && lessonSlug) {
      setUnitLessons([
        {
          id: lesson.id,
          slug: lessonSlug,
          title: lesson.title,
          test_id: testId ?? null,
          unit: null,
          is_completed: false,
        },
      ]);
    }
  }, [lesson?.id, lessonSlug, lesson?.title, testId]);
  useEffect(() => {
    const saved = sessionStorage.getItem(`course_${subjectSlug}_unitLessons`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUnitLessons(parsed);
      } catch (e) {}
    }
  }, [subjectSlug]);
  useEffect(() => {
    if (unitLessons.length > 0) {
      sessionStorage.setItem(
        `course_${subjectSlug}_unitLessons`,
        JSON.stringify(unitLessons),
      );
    }
  }, [unitLessons, subjectSlug]);
  useEffect(() => {
    async function loadUnitLessons() {
      if (!subjectSlug || !lesson?.id) return;

      try {
        const courseData = await apiFetch(`/courses/${subjectSlug}`);

        const currentLesson = courseData.lessons?.find(
          (l: any) => l.id === lesson.id,
        );
        if (!currentLesson?.unit?.id) return;

        const allLessons = courseData.lessons || [];

        const currentUnitLessons = allLessons
          .filter((l: any) => l.unit?.id === currentLesson.unit.id)
          .sort((a: any, b: any) => a.id - b.id);

        const lessonsWithStatus = await Promise.all(
          currentUnitLessons.map(async (l: any) => {
            let isCompleted = false;
            if (l.test_id) {
              try {
                const token = localStorage.getItem("token");
                if (token) {
                  const result = await apiFetch(`/tests/${l.test_id}/result`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                  });
                  if (result?.score !== undefined && result.score >= 75) {
                    isCompleted = true;
                  }
                }
              } catch (e) {}
            }
            return {
              ...l,
              is_completed: isCompleted,
              unit: currentLesson.unit,
            };
          }),
        );

        setUnitLessons(lessonsWithStatus);
      } catch (err) {}
    }

    loadUnitLessons();
  }, [subjectSlug, lesson?.id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const recordView = async () => {
      const token = localStorage.getItem("token");
      if (!token || !lesson?.id) return;
      try {
        await apiFetch(`/lessons/${lesson.id}/view`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {}
    };
    recordView();
  }, [lesson?.id]);

  useEffect(() => {
    if (!lesson?.id) return;
    const fetchViews = async () => {
      try {
        const data = await apiFetch(
          `/lessons/${lesson.id}/views?t=${Date.now()}`,
          {
            cache: "no-store",
          },
        );
        setViewCount(data.view_count);
      } catch {}
    };
    fetchViews();
  }, [lesson?.id]);

  useEffect(() => {
    if (!testId) return;

    const fetchResult = async () => {
      setLoadingResult(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoadingResult(false);
          return;
        }
        const result = await apiFetch(
          `/tests/${testId}/result?t=${Date.now()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );
        if (result) {
          setTestResult(result);
        }
      } catch (err) {
      } finally {
        setLoadingResult(false);
      }
    };
    fetchResult();
  }, [testId]);

  useEffect(() => {
    if (!lesson) return;
    async function fetchFlashcardStats() {
      const lessonId = lesson?.id;
      if (!lessonId) return;

      try {
        const stats = await apiFetch(
          `/lessons/${lessonId}/flashcards/stats`,
          {},
        );
        setFlashcardStats(stats);
      } catch (err) {}
    }

    if (lesson?.id) {
      fetchFlashcardStats();
    }
  }, [lesson?.id]);

  useEffect(() => {
    async function loadCourseAndNextLesson() {
      try {
        const courses: Array<{ id: number; title: string; slug: string }> =
          await apiFetch("/courses/subjects");
        if (!lesson) return;
        const currentCourse = courses.find((c) => c.slug === subjectSlug);
        if (currentCourse) {
          setCourseTitle(currentCourse.title);
          document.title = `${currentCourse.title}: ${lesson.title} | MaoSchool`;
        }

        const response = await apiFetch(`/courses/${subjectSlug}`);

        const lessons: Array<{ id: number; slug: string }> =
          response.lessons || [];

        const sorted = [...lessons].sort((a, b) => a.id - b.id);
        const currentIndex = sorted.findIndex((l) => l.id === lesson?.id);

        if (currentIndex !== -1 && currentIndex < sorted.length - 1) {
          const nextSlug = sorted[currentIndex + 1].slug;
          setNextLessonSlug(nextSlug);
        } else {
          setNextLessonSlug(null);
        }

        setLessonsLoaded(true);
      } catch (err) {
        setCourseTitle("Курс");
        setNextLessonSlug(null);
        setLessonsLoaded(true);
      }
    }

    if (subjectSlug && lesson?.id) {
      loadCourseAndNextLesson();
    }
  }, [subjectSlug, lesson?.id]);

  const handleStartTest = () => {
    const returnTo = `/courses/${subjectSlug}/${lessonSlug}`;

    if (testId) {
      saveTestReturnUrl(testId, returnTo);
    }

    window.location.href = `/tests/${testId}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleResetTestProgress = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Сброс прогресса теста",
      message:
        "Вы уверены, что хотите сбросить прогресс теста? Это действие нельзя отменить, и вам придётся проходить тест заново.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            openLogin();
            return;
          }
          await apiFetch(`/tests/${testId}/reset`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          setTestResult(null);
          showToast("Прогресс теста успешно сброшен", "success");
        } catch (err: any) {
          showToast(err.message || "Ошибка при сбросе прогресса", "error");
        }
      },
    });
  };

  useEffect(() => {}, [isLocked, lesson?.id]);

  if (isLocked) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Урок заблокирован 🔒
            </h2>
            <p className="text-gray-600 mb-6">
              Этот урок доступен только после записи на курс.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/courses/${subjectSlug}`}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
              >
                Записаться на курс
              </Link>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Назад
              </button>
            </div>
          </div>
        </div>
        <div className="fixed inset-0 z-40 bg-black/50 pointer-events-none" />
      </>
    );
  }

  if (!lesson) {
    return (
      <div className="p-10 text-center text-red-600">Ошибка загрузки урока</div>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1200px] mx-auto gap-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title || "Подтверждение"}
        message={confirmDialog.message || "Вы уверены?"}
        confirmText="Да, подтверждаю"
        cancelText="Отмена"
        type="danger"
      />

      <div className="flex-1 w-full items-center justify-center">
        <div className="w-full flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-row">
            {unitLessons.length > 0 && (
              <div className="flex flex-row items-center">
                <div className="flex flex-row">
                  {unitLessons.map((unitLesson) => {
                    const isCurrent = unitLesson.slug === lessonSlug;
                    const isCompleted = unitLesson.is_completed === true;

                    return (
                      <Link
                        key={unitLesson.id}
                        href={`/courses/${subjectSlug}/${unitLesson.slug}`}
                        className={`flex w-[25px] h-[25px] rounded-lg mx-[3px] items-center justify-center transition-all ${
                          isCurrent ? " border-[2px] border-purple-500" : ""
                        } ${isCompleted ? "bg-green-400" : "bg-gray-300 "}`}
                        title={unitLesson.title}
                      >
                        {isCompleted && (
                          <Check className="text-white h-4 w-4" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="w-full justify-end ">
            <div className="flex flex-row items-center justify-end ">
              <div className="flex flex-row items-center mt-[5px] mr-[15px]">
                <p className="smaller-text text-gray-800 mr-[5px]">
                  {viewCount?.toLocaleString("ru-RU") || "—"}
                </p>
                <Eye className="w-4 h-4 text-gray-500" />
              </div>
              <h1 className="bigger-text font-bold text-gray-900">
                {lesson.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex md:flex-row flex-col items-center w-full mt-[15px] justify-between">
          <div className="flex flex-row items-center  shadow-xs bg-white h-[50px] px-[10px] rounded-lg border-gray-200">
            <div className="flex flex-row items-center px-[7px] py-[3px] min-w-[90px]">
              <p className="smaller-text text-gray-600 font-semibold">
                Поделиться
              </p>
              <CopyLinkButton variant="icon" />
            </div>
            {lesson.time_minutes && (
              <div className="flex flex-row items-center border-l-[1px] border-gray-300">
                <p className="text-gray-600 pl-[10px] text-sm">
                  ~{lesson.time_minutes} минут
                </p>
                <Clock className="w-[15px] h-[15px] text-gray-600 ml-[5px]" />
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="p-[10px] bg-white shadow-xs rounded-lg mt-[10px] md:mt-[0px] h-[50px] flex flex-row items-center ">
              {loadingResult ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-200 border-t-purple-600" />
                </div>
              ) : testResult ? (
                <div className="flex flex-row items-center">
                  <div
                    className={`text-[12px] h-[30px] flex items-center rounded-lg px-[10px] ${
                      testResult.passed
                        ? "bg-green-50 border-green-400"
                        : "bg-red-50 border-red-400"
                    } border-[1px] font-bold mb-1 text-center`}
                  >
                    <span
                      className={
                        testResult.passed ? "text-green-400" : "text-red-400"
                      }
                    >
                      {testResult.score}%
                    </span>
                  </div>
                  <div className="flex flex-col ml-[10px]">
                    <p className="text-sm text-center text-gray-600">
                      {testResult.passed ? "Так держать!" : "Ты можешь лучше"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  Тест ещё не пройден
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-white shadow-sm h-[50px] rounded-lg flex flex-row border border-gray-200 items-center text-center">
              <p className="text-sm text-gray-600 smaller-text">
                <button
                  onClick={openLogin}
                  className="font-medium smaller-text text-purple-600 hover:underline"
                >
                  Войдите
                </button>
                , чтобы сохранять результаты
              </p>
            </div>
          )}
        </div>
        <div className="hidden">
          {lesson.description && (
            <p className="text-purple-700 mt-[25px] ord-text w-full text-center mb-8 leading-relaxed">
              {lesson.description}
            </p>
          )}
        </div>

        {lesson.content ? (
          <article
            className="prose prose-purple max-w-none w-full text-gray-800 lesson-content-root"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        ) : (
          <p className="text-gray-500 italic">Контент урока пока не добавлен</p>
        )}
      </div>

      <div className="flex flex-col shadow-xs bg-white px-[30px] p-[20px] rounded-lg w-full">
        {testId && (
          <p className="ord-text text-gray-700 font-normal text-sm mb-[10px]">
            <strong>Молодец!</strong> Ты прочитал всю теорию по данному уроку.
            Теперь самая важная часть — практика! Пройди тест, чтобы знать,
            остались ли где-то пробелы.
          </p>
        )}

        <div className="flex flex-row items-center mt-[20px] justify-between">
          <div className="flex flex-row">
            {testId && (
              <button
                onClick={handleStartTest}
                className="block min-w-[220px] cursor-pointer mt-[10px] md:mt-[0px] hover:bg-purple-700 duration-300 h-[55px] p-4 bg-purple-600 text-white rounded-xl font-medium text-sm transition font-semibold text-center"
              >
                {testResult?.score ? "Перепройти тест" : "Пройти тест"}
              </button>
            )}
          </div>

          {flashcardStats?.has_deck && (
            <div className="flex flex-row bg-white rounded-lg px-[20px] cursor-pointer w-full items-center">
              <button
                onClick={() => setShowFlashcards(true)}
                className="hover:bg-purple-200 cursor-pointer duration-300 items-center h-[55px] p-4 px-[30px] bg-purple-100 text-purple-700 rounded-xl font-medium transition flex flex-row"
              >
                <BookOpen className="w-5 h-5" />
                <div className="flex-col hidden lg:flex ml-[15px]">
                  <span className="ord-text whitespace-nowrap font-semibold text-purple-700 w-full text-center">
                    {flashcardStats.title}
                  </span>
                </div>
              </button>
            </div>
          )}
          <div className="flex flex-row items-center mt-[10px] md:mt-[0px]">
            {lessonsLoaded && nextLessonSlug ? (
              <Link
                href={`/courses/${subjectSlug}/${nextLessonSlug}`}
                className="block smaller-text items-center h-[55px] min-w-[160px] flex flex-row p-4 bg-purple-200 hover:bg-purple-300 duration-300 text-purple-700 rounded-xl font-semibold transition text-center"
              >
                <p>Следующий урок</p>
                <ArrowLeft className="rotate-180 w-[15px] ml-[5px] h-[15px]" />
              </Link>
            ) : lessonsLoaded ? (
              <div className="smaller-text hidden items-center h-[55px] min-w-[160px] flex flex-row p-4 bg-gray-100 border-[1px] border-gray-200 text-gray-400 rounded-xl font-medium text-center cursor-not-allowed">
                <p>Последний урок 🎉</p>
              </div>
            ) : (
              <div className="smaller-text items-center h-[55px] min-w-[160px] flex flex-row p-4 bg-purple-100 border-[1px] border-purple-200 text-purple-600 rounded-xl font-medium text-center animate-pulse">
                <p>Загрузка...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex md:flex-row flex-col w-full items-center">
        {showFlashcards && (
          <FlashcardSession
            lessonId={lesson?.id}
            onClose={() => setShowFlashcards(false)}
          />
        )}
      </div>

      <div className="flex flex-row w-full items-center justify-between">
        {lesson?.id && <LessonReactions lessonId={lesson?.id} />}

        <div className="flex shadow-xs  flex-row bg-white p-[5px] px-[10px] rounded-lg items-center min-w-[90px] mr-[5px]">
          <p className="smaller-text text-gray-600 font-semibold">Поделиться</p>
          <CopyLinkButton variant="icon" />
        </div>
      </div>

      {lesson?.id && <CommentsSection lessonId={lesson?.id} />}
    </main>
  );
}
