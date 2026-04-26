// frontend/app/ege/[slug]/[lesson]/LessonClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Lock } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Lesson = {
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

  // 🔍 Проверка авторизации при загрузке
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

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

  return (
    <main className="flex-1 flex flex-col lg:flex-row items-start px-4 sm:px-6 py-8 w-full max-w-6xl mx-auto gap-6">
      {/* 📄 Основной контент урока */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/ege/${subjectSlug}`}
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Все уроки</span>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {lesson.title}
        </h1>

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
      </div>

      {/* 📊 Сайдбар с результатом теста */}
      {testId && (
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="sticky top-6 space-y-4">
            {/* Кнопка пройти тест */}
            <Link
              href={`/tests/${testId}`}
              className="block w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition shadow-md text-center"
            >
              📝 Пройти тест
            </Link>

            {/* Результат (только для авторизованных) */}
            {isAuthenticated ? (
              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Ваш результат
                </h3>

                {loadingResult ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-200 border-t-purple-600" />
                  </div>
                ) : testResult ? (
                  <div
                    className={`p-3 rounded-lg ${testResult.passed ? "bg-green-50" : "bg-red-50"}`}
                  >
                    <div className="text-3xl font-bold mb-1 text-center">
                      <span
                        className={
                          testResult.passed ? "text-green-600" : "text-red-600"
                        }
                      >
                        {testResult.score}%
                      </span>
                    </div>
                    <p className="text-sm text-center text-gray-600 mb-2">
                      {testResult.passed
                        ? "✅ Тест пройден!"
                        : "❌ Не пройдено"}
                    </p>
                    <p className="text-xs text-gray-400 text-center">
                      {new Date(testResult.completed_at).toLocaleDateString(
                        "ru-RU",
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Тест ещё не пройден
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <Lock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Войдите</span>, чтобы сохранять
                  результаты
                </p>
              </div>
            )}
          </div>
        </aside>
      )}
    </main>
  );
}
