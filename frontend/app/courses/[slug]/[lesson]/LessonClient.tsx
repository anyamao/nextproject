// frontend/app/courses/[slug]/[lesson]/LessonClient.tsx
"use client";
import useContactStore from "@/store/states";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, Trophy, Lock, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import LessonReactions from "@/components/LessonReactions";
import CommentsSection from "@/components/CommentsSection";
import CopyLinkButton from "@/components/LinkButton";
import { saveTestReturnUrl } from "@/lib/test-return";
import FlashcardSession from "@/components/FlashcardSession";
import { BookOpen } from "lucide-react";
import { formatTimeAgo } from "@/lib/format-date";
type Lesson = {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  time_minutes: number | null;
};

type TestResult = {
  score: number;
  passed: boolean;
  completed_at: string;
};

interface LessonClientProps {
  lesson: Lesson;
  subjectSlug: string; // course slug
  lessonSlug: string;
  testId: number | null;
}

export default function LessonClient({
  lesson,
  subjectSlug,
  lessonSlug,
  testId,
}: LessonClientProps) {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);

  // ✅ Для хлебных крошек и "Следующего урока"
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [nextLessonSlug, setNextLessonSlug] = useState<string | null>(null);
  const [lessonsLoaded, setLessonsLoaded] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcardStats, setFlashcardStats] = useState<any>(null);
  const { openLogin } = useContactStore();

  // 🔍 Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // 👁️ Записать просмотр (курсовой эндпоинт!)
  useEffect(() => {
    const recordView = async () => {
      const token = localStorage.getItem("token");
      if (!token || !lesson.id) return;
      try {
        await apiFetch(`/lessons/${lesson.id}/view`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ View request sent");
      } catch (err) {
        console.log("ℹ️ View not recorded");
      }
    };
    recordView();
  }, [lesson.id]);

  // 👁️ Загрузить счётчик просмотров (курсовой эндпоинт!)
  useEffect(() => {
    if (!lesson.id) return;
    const fetchViews = async () => {
      try {
        const data = await apiFetch(
          `/lessons/${lesson.id}/views?t=${Date.now()}`,
          {
            cache: "no-store",
          },
        );
        setViewCount(data.view_count);
      } catch {
        console.log("ℹ️ Could not fetch view count");
      }
    };
    fetchViews();
  }, [lesson.id]);

  // 📥 Результат теста (курсовой эндпоинт!)
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
        if (result) setTestResult(result);
      } catch (err) {
        console.log("ℹ️ No saved result or not authorized");
      } finally {
        setLoadingResult(false);
      }
    };
    fetchResult();
  }, [testId]);

  useEffect(() => {
    async function fetchFlashcardStats() {
      try {
        const stats = await apiFetch(
          `/lessons/${lesson.id}/flashcards/stats`,
          {},
        );
        setFlashcardStats(stats);
      } catch (err) {
        // Карточек нет или ошибка — не страшно
        console.log("ℹ️ No flashcards for this lesson");
      }
    }

    if (lesson.id) {
      fetchFlashcardStats();
    }
  }, [lesson.id]);

  // ✅ Загрузка названия курса и следующего урока
  // ✅ Загрузка названия курса и следующего урока

  // frontend/app/courses/[slug]/[lesson]/LessonClient.tsx

  // ✅ Загрузка названия курса и следующего урока
  useEffect(() => {
    async function loadCourseAndNextLesson() {
      try {
        // 1️⃣ Загружаем все КУРСЫ (предметы), чтобы найти название текущего
        const courses: Array<{ id: number; title: string; slug: string }> =
          await apiFetch("/courses/subjects");

        const currentCourse = courses.find((c) => c.slug === subjectSlug);
        if (currentCourse) {
          setCourseTitle(currentCourse.title);
          document.title = `${currentCourse.title}: ${lesson.title} | MaoSchool`;
        }

        // 2️⃣ 🔥 Загружаем УРОКИ курса — теперь ответ { lessons, units }
        const response = await apiFetch(`/courses/${subjectSlug}`);

        // 🔥 ИЗВЛЕКАЕМ массив уроков из объекта!
        const lessons: Array<{ id: number; slug: string }> =
          response.lessons || [];

        console.log(
          `🔍 [LessonClient] Found ${lessons.length} lessons in course`,
        );
        console.log(`🔍 [LessonClient] Current lesson id: ${lesson.id}`);

        // Сортируем и ищем следующий урок
        const sorted = [...lessons].sort((a, b) => a.id - b.id); // 🔥 Копия массива, чтобы не мутировать оригинал
        const currentIndex = sorted.findIndex((l) => l.id === lesson.id);

        console.log(
          `🔍 [LessonClient] currentIndex: ${currentIndex}, total: ${sorted.length}`,
        );

        if (currentIndex !== -1 && currentIndex < sorted.length - 1) {
          const nextSlug = sorted[currentIndex + 1].slug;
          console.log(`✅ [LessonClient] Next lesson slug: ${nextSlug}`);
          setNextLessonSlug(nextSlug);
        } else {
          console.log(
            `ℹ️ [LessonClient] No next lesson (currentIndex=${currentIndex}, length=${sorted.length})`,
          );
          setNextLessonSlug(null);
        }

        setLessonsLoaded(true);
      } catch (err) {
        console.error(
          "❌ [LessonClient] Failed to load course/next lesson",
          err,
        );
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
    // ✅ Формируем правильный URL возврата
    const returnTo = `/courses/${subjectSlug}/${lessonSlug}`;

    if (testId) {
      // ✅ Сохраняем через хелпер
      saveTestReturnUrl(testId, returnTo);
    }

    // ✅ Переходим на тест с явным параметром returnTo
    window.location.href = `/tests/${testId}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  //
  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1000px] mx-auto gap-6">
      <div className="flex-1 w-full items-center justify-center">
        <div className="flex flex-row items-center text-gray-500 max-w-[400px] whitespace-nowrap overflow-x-auto smaller-text mb-[15px] font-semibold">
          <Link className="hover:underline  " href={`/courses`}>
            Курсы /
          </Link>

          <Link className="hover:underline " href={`/courses/${subjectSlug}`}>
            {courseTitle || "Загрузка..."} /
          </Link>
        </div>

        {/* Заголовок + просмотры */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between">
          <div className="w-full">
            <Link
              href={`/courses/${subjectSlug}`}
              className="text-black hover:text-purple-600 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Все уроки</span>
            </Link>
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

        {/* Панель: Поделиться + время + результат теста */}
        <div className="flex md:flex-row flex-col items-center w-full mt-[15px] justify-between">
          <div className="flex flex-row items-center bg-white h-[50px] px-[10px] rounded-lg shadow-sm border-[1px] border-gray-200">
            <div className="flex flex-row items-center px-[7px] py-[3px] min-w-[90px]">
              <p className="smaller-text text-gray-600">Поделиться</p>
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
            <div className="p-[10px] bg-white rounded-lg mt-[10px] md:mt-[0px] h-[50px] flex flex-row items-center border border-gray-200 shadow-sm">
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
                <span className="font-medium smaller-text">Войдите</span>, чтобы
                сохранять результаты
              </p>
            </div>
          )}
        </div>

        {/* Описание урока */}
        {lesson.description && (
          <p className="text-purple-700 mt-[25px] ord-text w-full text-center mb-8 leading-relaxed">
            {lesson.description}
          </p>
        )}

        {/* Контент урока */}
        {lesson.content ? (
          <article
            className="prose prose-purple max-w-none w-full text-gray-800 lesson-content-root"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        ) : (
          <p className="text-gray-500 italic">Контент урока пока не добавлен</p>
        )}
      </div>

      {/* Нижняя панель: реакции + тест + следующий урок */}
      <div className="flex flex-col text-wrap w-full">
        {testId && (
          <p className="ord-text mb-[10px]">
            <strong>Молодец!</strong> Ты прочитал всю теорию по данному уроку.
            Теперь самая важная часть — практика! Пройди тест, чтобы знать,
            остались ли где-то пробелы.
          </p>
        )}
        <p className="ord-text">
          Понравился урок? Поставь ему лайк и поделись с другом
        </p>

        <div className="flex flex-col md:flex-row items-center mt-[20px] justify-between">
          {lesson.id && <LessonReactions lessonId={lesson.id} />}

          {testId &&
            (isAuthenticated ? (
              <button
                onClick={handleStartTest}
                className="block w-[90%] max-w-[300px] mt-[10px] md:mt-[0px] hover:bg-purple-700 duration-300 h-[55px] p-4 bg-purple-600 text-white rounded-xl font-medium transition shadow-md text-center"
              >
                {testResult?.score ? "Перепройти тест" : "Пройти тест"}
              </button>
            ) : (
              <button
                onClick={openLogin}
                className="block w-[90%] max-w-[300px] hover:bg-purple-700 duration-300 h-[55px] p-4 bg-purple-600 text-white rounded-xl font-medium transition shadow-md text-center"
              >
                {testResult?.score ? "Перепройти тест" : "Пройти тест"}
              </button>
            ))}

          {/* ✅ Кнопка "Следующий урок" с умной логикой */}
          <div className="flex flex-row items-center mt-[10px] md:mt-[0px] ">
            <div className="flex flex-row items-center min-w-[90px] mr-[5px]">
              <p className="smaller-text text-gray-600">Поделиться</p>
              <CopyLinkButton variant="icon" />
            </div>

            {lessonsLoaded && nextLessonSlug ? (
              <Link
                href={`/courses/${subjectSlug}/${nextLessonSlug}`}
                className="block smaller-text items-center h-[55px] min-w-[160px] flex flex-row p-4 bg-purple-200 border-[1px] border-purple-300 hover:bg-purple-300 duration-300 text-purple-800 rounded-xl font-medium transition shadow-md text-center"
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
      <div className="flex md:flex-row flex-col w-full  items-center">
        {showFlashcards && (
          <FlashcardSession
            lessonId={lesson.id}
            onClose={() => setShowFlashcards(false)}
          />
        )}

        {flashcardStats?.has_deck && (
          <div className="flex flex-row w-full items-center">
            {isAuthenticated ? (
              <button
                onClick={() => setShowFlashcards(true)}
                className="hover:bg-purple-700 duration-300 items-center h-[55px] p-4 px-[30px] bg-purple-600 text-white rounded-xl font-medium transition shadow-md  flex flex-row "
              >
                <BookOpen className="w-5 h-5" />
                <div className="flex flex-col ml-[15px] ">
                  <span className="ord-text whitespace-nowrap font-semibold text-white w-full text-center  ">
                    {flashcardStats.title}
                  </span>
                  <span className="w-full smaller-text  whitespace-nowrap">
                    {(() => {
                      const total =
                        flashcardStats.due_count + flashcardStats.new_count;
                      const lastDigit = total % 10;
                      const lastTwoDigits = total % 100;

                      let word;
                      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
                        word = "карточек";
                      } else if (lastDigit === 1) {
                        word = "карточка";
                      } else if (lastDigit >= 2 && lastDigit <= 4) {
                        word = "карточки";
                      } else {
                        word = "карточек";
                      }

                      return `${total} ${word}`;
                    })()}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={openLogin}
                className="hover:bg-purple-700 duration-300 items-center h-[55px] p-4 px-[30px] bg-purple-600 text-white rounded-xl font-medium transition shadow-md  flex flex-row "
              >
                <BookOpen className="w-5 h-5" />
                <div className="flex flex-col ml-[15px] ">
                  <span className="ord-text whitespace-nowrap font-semibold text-white w-full text-center  ">
                    {flashcardStats.title}
                  </span>
                  <span className="w-full smaller-text  whitespace-nowrap"></span>
                </div>
              </button>
            )}
            <p className="smaller-text ml-[15px] ">
              <span className="bg-purple-200 ord-text font-bold mr-[5px]">
                Карточки для повторения
              </span>
              <strong>
                - следующий шаг, для тех, кто правда хочет учиться.{" "}
              </strong>
              После прохождения теста возвращайся сюда раз в неделю и открывай
              карточки к уроку. Там собраны в краткой форме все слова/ концепты
              для быстрого повторения
            </p>
          </div>
        )}
      </div>

      {/* Комментарии */}
      {lesson.id && <CommentsSection lessonId={lesson.id} />}
    </main>
  );
}
