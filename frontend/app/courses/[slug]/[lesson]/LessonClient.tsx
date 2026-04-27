// frontend/app/courses/[slug]/[lesson]/LessonClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";
import LessonReactions from "@/components/LessonReactions"; // или создай локально

type Lesson = {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  time_minutes: number | null;
};

interface LessonClientProps {
  lesson: Lesson;
  subjectSlug: string;
  lessonSlug: string;
  testId: number | null;
}
type TestResult = {
  score: number;
  passed: boolean;
  completed_at: string;
};
export default function LessonClient({
  lesson,
  subjectSlug,
  lessonSlug,
  testId,
}: LessonClientProps) {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  console.log("🎨 [LessonClient] RENDERED with lesson.id:", lesson?.id);
  // 👁️ Записать просмотр (только авторизованные, без sessionStorage!)
  useEffect(() => {
    console.log("👁️ [useEffect] lesson.id:", lesson.id); // ✅ ДОБАВЬ ЭТУ СТРОКУ
    const recordView = async () => {
      const token = localStorage.getItem("token");
      if (!token || !lesson.id) return;

      try {
        await apiFetch(`/lessons/${lesson.id}/view`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.log("ℹ️ View not recorded");
      }
    };
    recordView();
  }, [lesson.id]);

  // 👁️ Загрузить счётчик просмотров (с cache-busting)
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

  useEffect(() => {
    if (!testId) {
      console.log("ℹ️ No testId, skipping result fetch");
      return;
    }

    const fetchTestResult = async () => {
      setLoadingResult(true);
      console.log("🔍 Fetching test result for testId:", testId);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("ℹ️ No token, skipping authenticated result fetch");
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

        console.log("✅ Test result received:", result);

        if (result) {
          setTestResult(result);
        } else {
          console.log("ℹ️ No saved result for this test");
        }
      } catch (err: any) {
        console.log("❌ Failed to fetch test result:", err?.message || err);
      } finally {
        setLoadingResult(false);
      }
    };

    fetchTestResult();
  }, [testId]);

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      <Link
        href={`/courses/${subjectSlug}`}
        className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="w-5 h-5" /> Назад к курсу
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>

      {lesson.time_minutes && (
        <p className="text-gray-500 text-sm mb-6">
          ~{lesson.time_minutes} минут
        </p>
      )}

      {lesson.description && (
        <p className="text-gray-700 text-lg mb-8 leading-relaxed">
          {lesson.description}
        </p>
      )}

      {lesson.content ? (
        <article
          className="prose prose-purple max-w-none w-full text-gray-800"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      ) : (
        <p className="text-gray-500 italic">Контент урока пока не добавлен</p>
      )}
      {testId && localStorage.getItem("token") && (
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            🏆 Результат теста
          </h3>

          {loadingResult ? (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-200 border-t-purple-600" />
            </div>
          ) : testResult ? (
            <div
              className={`p-3 rounded-lg text-center ${testResult.passed ? "bg-green-50" : "bg-red-50"}`}
            >
              <div className="text-3xl font-bold mb-1">
                <span
                  className={
                    testResult.passed ? "text-green-600" : "text-red-600"
                  }
                >
                  {testResult.score}%
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {testResult.passed ? "✅ Тест пройден!" : "❌ Не пройдено"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(testResult.completed_at).toLocaleDateString("ru-RU")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              Тест ещё не пройден
            </p>
          )}
        </div>
      )}

      {testId && (
        <Link
          href={`/tests/${testId}`}
          className="mt-8 mb-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-md"
        >
          📝 Пройти тест по теме
        </Link>
      )}
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-500" />
          Просмотры
        </h3>
        <p className="text-2xl font-bold text-gray-900 text-center">
          {viewCount?.toLocaleString("ru-RU") || "—"}
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          уникальных пользователей
        </p>
      </div>

      {lesson.id && (
        <div>
          {" "}
          <LessonReactions key={`stats-${lesson.id}`} lessonId={lesson.id} />
        </div>
      )}
    </main>
  );
}
