// frontend/app/tests/[testId]/page.tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api"; // ✅ Универсальный fetch
import useContactStore from "@/store/states";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";

type QuestionType = "multiple_choice" | "input";

type EGEQuestion = {
  id: number; // 🔁 Теперь int
  question_text: string;
  question_type: QuestionType;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  // ❌ correct_answer НЕ возвращается с бэкенда (безопасность!)
  answer_type?: "number" | "decimal" | "text";
  explanation?: string | null;
  order_number: number; // 🔁 Было order_index
};

type EGETest = {
  id: number; // 🔁 Теперь int
  passing_score: number;
  time_limit_minutes?: number;
  questions: EGEQuestion[];
};

function TestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useContactStore();

  const testId = searchParams.get("id");
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [test, setTest] = useState<EGETest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({}); // 🔁 number keys
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!testId) {
      setError("No test ID provided");
      setLoading(false);
      return;
    }

    const fetchTest = async () => {
      try {
        // 🔁 Fetch теста через FastAPI
        const testData = await apiFetch(`/api/tests/${testId}`);

        setTest({
          id: testData.id,
          passing_score: testData.passing_score || 75,
          time_limit_minutes: testData.time_limit_minutes,
          questions: testData.questions || [],
        });
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError("Failed to load test");
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleOptionSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const normalizeAnswer = (answer: string, type?: string): string => {
    if (type === "decimal" || type === "number") {
      const num = parseFloat(answer);
      if (isNaN(num)) return "";
      return type === "decimal" ? num.toFixed(2) : String(Math.round(num));
    }
    return answer.trim().toLowerCase();
  };

  const calculateScore = () => {
    if (!test) return 0;
    let correct = 0;

    test.questions.forEach((q) => {
      // 🔁 Для input-вопросов: сравниваем на клиенте (в продакшене лучше проверять на сервере)
      if (q.question_type === "input") {
        const userAnswer = normalizeAnswer(
          answers[q.id] || "",
          q.answer_type || "text",
        );
        // ⚠️ В продакшене НЕ храни correct_answer на клиенте!
        // Здесь для демо — упрощённая проверка
        const correctAnswer = normalizeAnswer(
          (q as any).correct_answer || "", // 🔁 Только для демо!
          q.answer_type || "text",
        );
        if (userAnswer === correctAnswer && userAnswer !== "") {
          correct++;
        }
      } else {
        // Для multiple_choice: правильный ответ определяется на сервере при submit
        // Здесь просто считаем, что пользователь ответил
        if (answers[q.id]?.trim()) {
          correct++; // 🔁 Заглушка — реальная проверка на сервере
        }
      }
    });

    return Math.round((correct / test.questions.length) * 100);
  };

  // frontend/app/tests/[testId]/page.tsx
  // frontend/app/tests/[testId]/page.tsx

  const handleSubmit = async () => {
    if (!test) return;

    const unanswered = test.questions.filter((q) => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      alert(
        `Пожалуйста, ответьте на все вопросы. Осталось: ${unanswered.length}`,
      );
      return;
    }

    setLoading(true);

    try {
      // 🔁 Получаем токен
      const token = localStorage.getItem("token");
      console.log(
        "🔍 Submit token:",
        token ? `${token.slice(0, 20)}...` : "NULL",
      );

      // 🔁 Формируем заголовки
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`; // ✅ Обязательно "Bearer " с пробелом!
      }

      console.log("🔍 Submit headers:", headers);

      // 🔁 Отправляем запрос
      const response = await fetch(
        `http://localhost:8010/api/tests/${test.id}/submit`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ answers }),
        },
      );

      // 🔁 Логируем ответ для отладки
      const responseText = await response.text();
      console.log("🔍 Submit response status:", response.status);
      console.log("🔍 Submit response body:", responseText);

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      setScore(result.score);
      setPassed(result.passed);
      setSubmitted(true);
    } catch (err) {
      console.error("❌ Submit error:", err);
      setError("Failed to submit test");
    } finally {
      setLoading(false);
    }
  };
  const handleReturn = () => {
    router.push(returnUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
        <p className="ml-4">Загрузка теста...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">
            ❌ {error || "Test not found"}
          </p>
          <p className="text-gray-600 mb-4">Test ID: {testId}</p>
          <button
            onClick={handleReturn}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Вернуться к уроку
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <main className="flex-1 flex flex-col items-center px-[20px] py-[30px] w-full max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full text-center">
          {passed ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-2">
            {passed ? "Поздравляем!" : "Попробуйте ещё раз"}
          </h1>
          <p className="text-gray-600 mb-6">
            Ваш результат:{" "}
            <span className="font-bold text-purple-600">{score}%</span>
            {test.passing_score && ` (проходной: ${test.passing_score}%)`}
          </p>
          <button
            onClick={handleReturn}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Вернуться к уроку
          </button>
        </div>
      </main>
    );
  }

  const question = test.questions[currentQuestion];
  const progress = Math.round(
    ((currentQuestion + 1) / test.questions.length) * 100,
  );

  const options = [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
  ].filter(Boolean);

  return (
    <main className="flex-1 flex flex-col items-center px-[20px] py-[30px] w-full max-w-3xl mx-auto">
      {/* Header with Progress Bar */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleReturn}
            className="text-gray-600 hover:text-purple-600 transition text-sm"
          >
            ← Вернуться
          </button>
          {test.time_limit_minutes && (
            <span className="text-sm text-gray-500">
              ⏱ {test.time_limit_minutes} мин
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Вопрос {currentQuestion + 1} из {test.questions.length}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 w-full mb-6">
        <p className="text-lg font-medium mb-4">
          {currentQuestion + 1}. {question.question_text}
        </p>

        {question.question_type === "multiple_choice" && options.length > 0 && (
          <div className="space-y-3">
            {options.map((option, idx) => {
              if (!option) return null;

              const optionLetter = String.fromCharCode(97 + idx);
              const isSelected = answers[question.id] === option;

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(question.id, option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium mr-2">
                    {optionLetter.toUpperCase()}.
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {question.question_type === "input" && (
          <div className="space-y-3">
            <input
              type="text"
              inputMode={question.answer_type === "text" ? "text" : "decimal"}
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder={
                question.answer_type === "decimal"
                  ? "Например: 0.45"
                  : question.answer_type === "number"
                    ? "Например: 5"
                    : "Введите ответ"
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition text-lg"
            />
            {question.answer_type === "decimal" && (
              <p className="text-xs text-gray-500">
                💡 Округляйте до сотых, если требуется
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-purple-600 transition"
        >
          ← Назад
        </button>

        {currentQuestion < test.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion((prev) => prev + 1)}
            disabled={!answers[question.id]?.trim()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            Далее <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={
              test.questions.some((q) => !answers[q.id]?.trim()) || loading
            }
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Завершить тест
          </button>
        )}
      </div>
    </main>
  );
}

export default function TestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
          <p className="ml-4">Загрузка...</p>
        </div>
      }
    >
      <TestContent />
    </Suspense>
  );
}
