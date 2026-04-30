// frontend/app/tests/[id]/results/ResultsContent.tsx
"use client"; // ✅ Только здесь!

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, RotateCcw, ArrowLeft, X, Check } from "lucide-react";
import { getTestReturnUrl } from "@/lib/test-return";

type Result = {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
};

interface ResultsContentProps {
  testId: number;
  returnTo: string | null; // ✅ Принимаем returnTo как prop
}

export default function ResultsContent({
  testId,
  returnTo,
}: ResultsContentProps) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storageKey = `test_${testId}_result`;
    const stored = sessionStorage.getItem(storageKey);

    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch (e) {
        console.error("❌ Failed to parse result:", e);
      }
    }
    setLoading(false);
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-6 text-center">
        <X className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Результат не найден
        </h1>
        <p className="text-gray-600 mb-6">Попробуйте пройти тест ещё раз</p>
        <Link
          href={`/tests/${testId}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
        >
          <RotateCcw className="w-4 h-4" /> Пройти ещё раз
        </Link>
      </div>
    );
  }

  // 🔥 Умный редирект: используем returnTo или определяем из sessionStorage
  const getReturnUrl = () => {
    // 1️⃣ Если передан returnTo — используем его
    if (returnTo) {
      return returnTo;
    }

    // 2️⃣ Пробуем взять из sessionStorage (сохраняем перед тестом)
    const saved = sessionStorage.getItem(`test_${testId}_returnTo`);
    if (saved) {
      return saved;
    }

    // 3️⃣ Дефолт для ЕГЭ
    return "/ege/math-profile";
  };

  const finalReturnTo = getTestReturnUrl(testId, "/ege/math-profile");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 🏆 Заголовок */}
        <div
          className={`inline-flex items-center gap-3 px-6 py-3 rounded-full mb-8 ${
            result.passed
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          <span className="font-semibold">
            {result.passed ? "Тест пройден!" : "Попробуйте ещё раз"}
          </span>
        </div>

        {/* 📊 Результат */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="text-7xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent">
            {result.score}%
          </div>
          <p className="text-gray-600 text-lg mb-6">
            {result.correct} из {result.total} правильных ответов
          </p>

          {/* Прогресс-круг */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={result.passed ? "#22c55e" : "#ef4444"}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - result.score / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">
                {result.score}%
              </span>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={finalReturnTo} // ✅ Используем умный редирект
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Вернуться к уроку
            </Link>
            <Link
              href={`/tests/${testId}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-md"
            >
              <RotateCcw className="w-4 h-4" /> Пройти ещё раз
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
