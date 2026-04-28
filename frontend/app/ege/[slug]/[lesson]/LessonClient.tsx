// frontend/app/ege/[slug]/[lesson]/LessonClient.tsx
"use client";
import CommentsSection from "@/components/CommentsSection";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Trophy, Lock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import LessonReactions from "@/components/LessonReactions";
import CopyLinkButton from "@/components/LinkButton";
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
    if (!isAuthenticated || !testId) return; // testId здесь — просто маркер, что урок загружен

    const recordView = async () => {
      const token = localStorage.getItem("token");
      if (!token || !lesson.id) return;

      try {
        // ✅ Просто отправляем запрос. Бэкенд сам разбеdevtestрется (ON CONFLICT DO NOTHING)
        await apiFetch(`/lessons/${lesson.id}/view`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ View request sent");
      } catch (err) {
        console.log("ℹ️ View not recorded (maybe already viewed or error)");
      }
    };
    recordView();
  }, [lesson.id]);

  return (
    <main className="flex-1 flex flex-col  items-center  sm:px-6 py-8 w-full max-w-[1100px] mx-auto gap-6">
      <div className="flex-1 w-full">
        <div className="w-full flex flex-row items-center  justify-between">
          <Link
            href={`/ege/${subjectSlug}`}
            className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 "
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

        <div className="flex flex-row items-center w-full mt-[10px] justify-between">
          <div className="flex flex-row items-center">
            <div className="flex flex-row items-center bg-white rounded-xl shadow-md px-[7px] py-[3px] min-w-[90px]">
              <p className="smaller-text text-gray-500">Поделиться</p>
              <CopyLinkButton variant="icon" />
            </div>
            {lesson.time_minutes && (
              <p className="text-gray-500 ml-[10px] text-sm ">
                ~{lesson.time_minutes} минут
              </p>
            )}
          </div>
          {isAuthenticated ? (
            <div className="p-[10px] bg-white rounded-xl flex flex-row items-center  border border-gray-200 shadow-sm">
              {loadingResult ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-200 border-t-purple-600" />
                </div>
              ) : testResult ? (
                <div className={` rounded-lg flex flex-row items-center `}>
                  <div
                    className={`bigger-text rounded-full r ${testResult.passed ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"} border-[1px] p-[7px] font-bold mb-1 text-center`}
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
                      {testResult.passed ? "Тест пройден!" : "Не пройдено"}
                    </p>
                    <p className="text-xs text-gray-400 text-center">
                      {new Date(testResult.completed_at).toLocaleDateString(
                        "ru-RU",
                      )}
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
            <div className="p-4 bg-gray-50 rounded-xl  flex flex-row border border-gray-200 items-center  text-center">
              <p className="text-sm text-gray-600 smaller-text">
                <span className="font-medium smaller-text">Войдите</span>, чтобы
                сохранять результаты
              </p>
            </div>
          )}
        </div>

        {lesson.description && (
          <p className="text-gray-700 mt-[25px] ord-text font-semibold w-full text-center mb-8 leading-relaxed">
            {lesson.description}
          </p>
        )}

        {lesson.content ? (
          <article
            className="prose prose-purple  w-full text-gray-800"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        ) : (
          <p className="text-gray-500 italic">Контент урока пока не добавлен</p>
        )}
      </div>
      <div className="text-wrap flex flex-row items-center jsutify-around">
        {lesson.id && <LessonReactions lessonId={lesson.id} />}

        {testId && (
          <div className="flex w-full justify-center items-center">
            <Link
              href={`/tests/${testId}`}
              className="block w-[90%] max-w-[400px] p-4 bg-purple-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition shadow-md text-center"
            >
              Пройти тест
            </Link>
          </div>
        )}
        <div className="flex flex-row items-center min-w-[90px]">
          <p className="smaller-text text-gray-500">Поделиться</p>
          <CopyLinkButton variant="icon" />
        </div>
      </div>
      {lesson.id && <CommentsSection lessonId={lesson.id} />}
    </main>
  );
}
