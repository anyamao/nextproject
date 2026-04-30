// frontend/app/ege/[slug]/[lesson]/LessonClient.tsx
"use client";
import CommentsSection from "@/components/CommentsSection";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Trophy, Lock, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import LessonReactions from "@/components/LessonReactions";
import CopyLinkButton from "@/components/LinkButton";
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
  subjectSlug: string;
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
  // 🔍 Проверка авторизации при загрузке
  const [subjectTitle, setSubjectTitle] = useState<string>("");
  const [nextLessonSlug, setNextLessonSlug] = useState<string | null>(null);
  const [lessonsLoaded, setLessonsLoaded] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcardStats, setFlashcardStats] = useState<any>(null);

  useEffect(() => {
    async function loadSubjectAndNextLesson() {
      try {
        // 1️⃣ Загружаем все предметы для получения названия текущего
        const subjects: Array<{ id: number; title: string; slug: string }> =
          await apiFetch("/ege");
        const currentSubject = subjects.find((s) => s.slug === subjectSlug);
        if (currentSubject) {
          setSubjectTitle(currentSubject.title);
          // ✅ Обновляем title страницы для SEO
          document.title = `${currentSubject.title}: ${lesson.title} — ЕГЭ | MaoSchool`;
        }

        // 2️⃣ Загружаем все уроки предмета чтобы найти следующий
        const lessons: Array<{ id: number; slug: string }> = await apiFetch(
          `/ege/${subjectSlug}`,
        );

        // Сортируем по id и ищем урок с бОльшим id чем текущий
        const sorted = lessons.sort((a, b) => a.id - b.id);
        const currentIndex = sorted.findIndex((l) => l.id === lesson.id);

        if (currentIndex !== -1 && currentIndex < sorted.length - 1) {
          // ✅ Есть следующий урок!
          setNextLessonSlug(sorted[currentIndex + 1].slug);
        } else {
          // ❌ Это последний урок
          setNextLessonSlug(null);
        }

        setLessonsLoaded(true);
      } catch (err) {
        console.error("Failed to load subject/next lesson", err);
        setSubjectTitle("Предмет");
        setNextLessonSlug(null);
        setLessonsLoaded(true);
      }
    }

    if (subjectSlug && lesson?.id) {
      loadSubjectAndNextLesson();
    }
  }, [subjectSlug, lesson?.id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);
  useEffect(() => {
    const fetchViews = async () => {
      try {
        const data = await apiFetch(`/ege/${subjectSlug}/${lessonSlug}/views`);
        setViewCount(data.view_count);
      } catch (err) {
        console.log("ℹ️ Could not fetch view count");
      }
    };
    fetchViews();
  }, [subjectSlug, lessonSlug]);
  // 📥 Загрузка результата теста (если авторизован и есть тест)
  useEffect(() => {
    if (!isAuthenticated || !testId) return;

    const fetchResult = async () => {
      setLoadingResult(true);
      try {
        const result = await apiFetch(`/tests/${testId}/result`);
        if (result) {
          setTestResult(result);
        }
      } catch (err) {
        console.log("ℹ️ No saved result or not authorized");
      } finally {
        setLoadingResult(false);
      }
    };
    fetchResult();
  }, [isAuthenticated, testId]);

  useEffect(() => {
    console.log("✅ ENTERED RECORD VIEW MODE");

    // 🔥 Читаем токен напрямую, как в комментариях и лайках
    const token = localStorage.getItem("token");

    if (!token || !lesson?.id) {
      console.log("⚠️ Skipping view: no token or no lesson.id");
      return;
    }

    console.log("✅ Token present, recording view...");

    const recordView = async () => {
      try {
        await apiFetch(`/lessons/${lesson.id}/view`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ View request sent");
      } catch (err) {
        console.log("ℹ️ View not recorded:", err);
      }
    };

    recordView();
  }, [lesson?.id]); // ✅ Только lesson.id в зависимостях
  useEffect(() => {
    async function fetchFlashcardStats() {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const stats = await apiFetch(`/lessons/${lesson.id}/flashcards/stats`, {
          headers,
        });
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

  return (
    <main className="flex-1 flex flex-col  items-center  sm:px-6 py-8 w-full max-w-[1000px] mx-auto gap-6">
      <div className="flex-1 w-full items-center justify-center ">
        <div className="flex flex-row items-center text-gray-500 smaller-text mb-[15px] font-semibold">
          <Link className="hover:underline" href="/ege">
            ЕГЭ /
          </Link>
          <Link className="hover:underline " href={`/ege/${subjectSlug}`}>
            {subjectTitle || "Загрузка..."} /
          </Link>
          <p className="">{lesson.title || "Загрузка..."}</p>
        </div>

        <div className="w-full flex flex-row items-center  justify-between">
          <Link
            href={`/ege/${subjectSlug}`}
            className="text-black hover:text-purple-600 transition flex items-center gap-2 "
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Все уроки</span>
          </Link>

          <div className="flex flex-row items-center">
            <div className="flex flex-row items-center mt-[5px] mr-[15px] ">
              <p className="smaller-text  text-gray-800 mr-[5px]">
                {viewCount?.toLocaleString("ru-RU") || "—"}
              </p>
              <Eye className="w-4 h-4 text-gray-500" />
            </div>
            <h1 className="bigger-text font-bold text-gray-900">
              {lesson.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-row items-center w-full mt-[15px] justify-between">
          <div className="flex flex-row items-center bg-white h-[50px] px-[10px] rounded-lg shadow-sm border-[1px] border-gray-200">
            <div className="flex flex-row items-center px-[7px] py-[3px] min-w-[90px]">
              <p className="smaller-text text-gray-600">Поделиться</p>
              <CopyLinkButton variant="icon" />
            </div>
            {lesson.time_minutes && (
              <div className="flex flex-row items-center border-l-[1px] border-gray-300">
                <p className="text-gray-600 pl-[10px]  text-sm ">
                  ~{lesson.time_minutes} минут
                </p>
                <Clock className="w-[15px] h-[15px] text-gray-600 ml-[5px]"></Clock>
              </div>
            )}
          </div>
          {isAuthenticated ? (
            <div className="p-[10px] bg-white rounded-lg h-[50px] flex flex-row items-center  border border-gray-200 shadow-sm">
              {loadingResult ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-200 border-t-purple-600" />
                </div>
              ) : testResult ? (
                <div className={`  flex flex-row items-center `}>
                  <div
                    className={`text-[12px] h-[30px] flex items-center  rounded-lg px-[10px] ${testResult.passed ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"} border-[1px] font-bold mb-1 text-center`}
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
                    <p className="text-sm text-center text-gray-600 ">
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
            <div className="p-4 bg-white shadow-sm h-[50px] rounded-lg  flex flex-row border border-gray-200 items-center  text-center">
              <p className="text-sm text-gray-600 smaller-text">
                <span className="font-medium smaller-text">Войдите</span>, чтобы
                сохранять результаты
              </p>
            </div>
          )}
        </div>

        {lesson.description && (
          <p className="text-purple-700 mt-[25px] ord-text  w-full text-center mb-8 leading-relaxed">
            {lesson.description}
          </p>
        )}

        {lesson.content ? (
          <article
            className="prose prose-purple max-w-none w-full text-gray-800 lesson-content-root"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        ) : (
          <p className="text-gray-500 italic">Контент урока пока не добавлен</p>
        )}
      </div>
      <div className="flex flex-col  text-wrap w-full ">
        {testId && (
          <p className={` ord-text mb-[10px]`}>
            <strong> Молодец! </strong> Ты прочитал всю теорию по данному уроку.
            Теперь самая важная часть - практика! Пройди тест, чтобы знать,
            остались ли где-то пробелы.
          </p>
        )}
        <p className="ord-text">
          Понравился урок? Поставь ему лайк и поделись с другом
        </p>
        <div className="flex flex-row items-center mt-[20px] justify-between ">
          {lesson.id && <LessonReactions lessonId={lesson.id} />}

          {testId && (
            <Link
              href={`/tests/${testId}`}
              className="block w-[90%] max-w-[300px] hover:bg-purple-700 duration-300 h-[55px] p-4 bg-purple-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition shadow-md text-center"
            >
              {testResult?.score ? "Перепройти тест" : "Пройти тест"}
            </Link>
          )}
          <div className="flex flex-row items-center">
            <div className="flex flex-row items-center min-w-[90px] mr-[5px]">
              <p className="smaller-text text-gray-600">Поделиться</p>
              <CopyLinkButton variant="icon" />
            </div>

            {lessonsLoaded && nextLessonSlug ? (
              <Link
                href={`/ege/${subjectSlug}/${nextLessonSlug}`} // ✅ Ссылка на следующий урок!
                className="block smaller-text items-center h-[55px] min-w-[160px] flex flex-row p-4 bg-purple-200 border-[1px] border-purple-300 hover:bg-purple-300 duration-300 text-purple-800 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition shadow-md text-center"
              >
                <p>Следующий урок</p>
                <ArrowLeft className="rotate-180 w-[15px] ml-[5px] h-[15px]" />
              </Link>
            ) : lessonsLoaded ? (
              <div className="smaller-text hidden items-center  h-[55px] min-w-[160px] flex flex-row p-4 bg-gray-100 border-[1px] border-gray-200 text-gray-400 rounded-xl font-medium text-center cursor-not-allowed"></div>
            ) : (
              /* ✅ Пока грузятся данные — показываем лоадер */
              <div className="smaller-text items-center h-[55px] min-w-[160px] flex flex-row p-4 bg-purple-100 border-[1px] border-purple-200 text-purple-600 rounded-xl font-medium text-center animate-pulse">
                <p>Загрузка...</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-row w-full  items-center">
        {showFlashcards && (
          <FlashcardSession
            lessonId={lesson.id}
            onClose={() => setShowFlashcards(false)}
          />
        )}
        {flashcardStats?.has_deck && (
          <div className="flex flex-row w-full items-center">
            <button
              onClick={() => setShowFlashcards(true)}
              className="hover:bg-purple-700 duration-300 items-center h-[55px] p-4 bg-purple-600 text-white rounded-xl font-medium transition shadow-md  flex flex-row "
            >
              <BookOpen className="w-5 h-5" />
              <div className="flex flex-col ml-[15px] ">
                <span className="text-xs whitespace-nowrap font-semibold text-white w-full text-center  ">
                  {flashcardStats.title}
                </span>
                <span className="w-full whitespace-nowrap">
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
            <p className="smaller-text ml-[10px] ">
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

      {lesson.id && <CommentsSection lessonId={lesson.id} />}
    </main>
  );
}
