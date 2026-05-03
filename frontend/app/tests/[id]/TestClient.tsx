// frontend/app/tests/[id]/TestClient.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  RefreshCw,
  ChevronDown,
  BookOpen,
  Trophy,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getTestReturnUrl } from "@/lib/test-return";

type Question = {
  id: number;
  question_text: string;
  order_index: number;
  user_answer?: string;
  is_answered?: boolean;
  is_correct?: boolean;
  expected_answer?: string;
  solution?: string | null;
};

type Test = {
  id: number;
  title: string;
  passing_score: number;
  questions: Question[];
  lesson_id: number;
};

export default function TestClient({
  test,
  lessonSlug,
  subjectSlug,
}: {
  test: Test;
  lessonSlug: string;
  subjectSlug: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(test.questions);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    expected?: string;
    solution?: string | null;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  // 🔁 Сброс состояния ТОЛЬКО при смене индекса вопроса
  useEffect(() => {
    setCurrentAnswer(questions[currentIndex]?.user_answer || "");
    setFeedback(null);
    setIsChecking(false);
  }, [currentIndex]);

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim() || isChecking) return;

    setIsChecking(true);

    try {
      const result = await apiFetch(
        `/tests/${test.id}/question/${currentQuestion.id}/check?answer=${encodeURIComponent(currentAnswer)}`,
        { method: "POST" },
      );

      setFeedback({
        correct: result.correct,
        expected: result.expected,
        solution: result.solution,
      });

      // Обновляем вопрос в списке
      setQuestions((prev) =>
        prev.map((q, idx) =>
          idx === currentIndex
            ? {
                ...q,
                user_answer: currentAnswer,
                is_answered: true,
                is_correct: result.correct,
                expected_answer: result.expected,
                solution: result.solution,
              }
            : q,
        ),
      );
    } catch (err) {
      console.error("❌ Check failed:", err);
      setFeedback({ correct: false, expected: "Ошибка сети" });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    console.log("🧪 [TestClient] Mounted with props:", {
      testId: test.id,
      lessonSlug,
      subjectSlug,
    });

    // 🔍 Читаем returnTo ИЗ ПАРАМЕТРОВ URL, а не из document.referrer!
    const returnTo = getTestReturnUrl(
      test.id,
      `/courses/${subjectSlug}/${lessonSlug}`,
    );

    console.log("🧪 [TestClient] returnTo resolved:", returnTo);

    // Сохраняем в состоянии для использования при редиректе
    // (или просто используй getTestReturnUrl прямо в handleNext)
  }, [test.id, subjectSlug, lessonSlug]);

  const handleNext = async () => {
    // Переход к следующему вопросу
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
    const returnTo = getTestReturnUrl(
      test.id,
      `/courses/${subjectSlug}/${lessonSlug}`,
    );

    // 🎯 Тест завершён — считаем результат
    const correctCount = questions.filter((q) => q.is_correct).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= test.passing_score;

    // 🔐 Если пользователь авторизован — сохраняем результат в БД
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await apiFetch(`/tests/${test.id}/complete`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ score, passed }),
        });
        console.log("✅ Result saved to database");
      }
    } catch (err) {
      console.error("❌ Failed to save result:", err);
      // Не блокируем пользователя, если сохранение не удалось
    }

    // Сохраняем в sessionStorage для мгновенного отображения результатов
    sessionStorage.setItem(
      `test_${test.id}_result`,
      JSON.stringify({
        score,
        correct: correctCount,
        total: questions.length,
        passed,
      }),
    );
    window.location.href = `/tests/${test.id}/results?returnTo=${encodeURIComponent(returnTo)}`;
    // Редирект на страницу результатов
  };

  const handleRetry = () => {
    setCurrentAnswer("");
    setFeedback(null);
  };

  // 🔹 Вспомогательный компонент для сворачиваемого решения
  function SolutionBlock({ solution }: { solution: string }) {
    const [isExpanded, setIsExpanded] = useState(true); // ✅ По умолчанию развёрнуто

    return (
      <div className="mt-3 mx-[20px] my-[20px] ">
        {/* 🔹 Заголовок с кнопкой сворачивания */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between px-[10px] py-2 text-left hover:bg-purple-50 rounded-lg transition group"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span className="text-sm bigger-text font-medium text-purple-800">
              Решение:
            </span>
          </div>

          {/* 🔹 Стрелочка с анимацией поворота */}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            } group-hover:text-purple-600`}
          />
        </button>

        {/* 🔹 Контент решения с анимацией появления */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div
            className="text-sm text-gray-700 my-[10px] px-[10px] pb-[20px] pb-2 solution-content"
            dangerouslySetInnerHTML={{ __html: solution }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className=" w-full max-w-[1100px] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 🔙 Назад + Прогресс */}
        <div className="mb-5">
          <Link
            href={`/courses/${subjectSlug}/${lessonSlug}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Вернуться к уроку</span>
          </Link>

          <div className="flex items-center flex-col md:flex-row justify-between mb-2">
            <div className="w-full">
              <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
            </div>
            <div className="w-full flex justify-end h-[30px] ">
              <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-300">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="my-3 text-center text-sm text-gray-500">
          Правильных:{" "}
          <span className="">
            {questions.filter((q) => q.is_correct).length}
          </span>{" "}
          / {questions.length}
        </div>

        {/* 📦 Карточка вопроса */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Текст вопроса */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex flex-col md:flex-row  items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm">
                {currentIndex + 1}
              </span>

              <div
                className="text-lg font-medium text-gray-900 leading-relaxed question-content"
                dangerouslySetInnerHTML={{
                  __html: currentQuestion?.question_text || "",
                }}
              />
            </div>
          </div>

          {/* Поле ввода */}
          <div className="p-6 space-y-4 w-full">
            <div className="relative">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !feedback && handleAnswerSubmit()
                }
                placeholder="Введите ваш ответ..."
                disabled={!!feedback}
                className={`w-full whitespace-nowrap overflow-x-auto  p-4 pr-12 border-2 rounded-xl text-lg outline-none transition ${
                  feedback
                    ? feedback.correct
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                    : "border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                }`}
              />
              {feedback && (
                <div
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                    feedback.correct ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {feedback.correct ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <X className="w-6 h-6" />
                  )}
                </div>
              )}
            </div>

            {/* Обратная связь */}
            {feedback && (
              <div className="flex flex-col">
                <div
                  className={`p-4 rounded-xl border-2 ${
                    feedback.correct
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        feedback.correct
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {feedback.correct ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-semibold ${
                          feedback.correct ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {feedback.correct ? "✅ Правильно!" : "❌ Неверно"}
                      </p>
                      {!feedback.correct && feedback.expected && (
                        <p className="text-sm text-gray-700 mt-1">
                          Правильный ответ:{" "}
                          <span className="font-mono font-medium">
                            {feedback.expected}
                          </span>
                        </p>
                      )}
                      {!feedback.correct && (
                        <button
                          onClick={handleRetry}
                          className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Попробовать ещё раз
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Кнопка повторной попытки (если неверно) */}
              </div>
            )}
          </div>

          {/* Кнопки навигации */}
          <div className="px-6 py-2  flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 transition font-medium inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Назад
            </button>

            {/* Логика кнопок: проверяем -> показываем результат -> переходим дальше */}
            {!feedback ? (
              <button
                onClick={handleAnswerSubmit}
                disabled={!currentAnswer.trim() || isChecking}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChecking ? "Проверяем..." : "Проверить ответ"}
              </button>
            ) : feedback.correct ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition shadow-md inline-flex items-center gap-2"
              >
                {isLastQuestion ? (
                  <>
                    Завершить тест <Trophy className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Далее <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition inline-flex items-center gap-2"
              >
                Пропустить <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {feedback && feedback.solution && (
            <SolutionBlock solution={feedback.solution} />
          )}
        </div>

        {/* Статистика */}
      </div>
    </div>
  );
}
