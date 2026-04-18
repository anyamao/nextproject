"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useContactStore from "@/store/states";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";

type QuestionType = "multiple_choice" | "input";

type EGEQuestion = {
  id: string;
  question_text: string;
  question_type: QuestionType;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  correct_answer: string;
  answer_type?: "number" | "decimal" | "text";
  explanation?: string | null;
  order_index: number;
};

type EGETest = {
  id: string;
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
        const { data: testData, error: testError } = await supabase
          .from("ege_tests")
          .select("id, passing_score, time_limit_minutes")
          .eq("id", testId)
          .single();

        if (testError || !testData) {
          console.error("❌ Test fetch error:", testError);
          setError("Test not found");
          setLoading(false);
          return;
        }

        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select(
            `
            id, 
            question_text, 
            question_type,
            option_a, 
            option_b, 
            option_c, 
            option_d, 
            correct_answer, 
            answer_type, 
            explanation, 
            order_index
          `,
          )
          .eq("test_id", testId)
          .order("order_index", { ascending: true });

        if (questionsError) {
          console.error("❌ Questions fetch error:", questionsError);
          setError("Failed to load questions");
          setLoading(false);
          return;
        }

        setTest({
          id: testData.id,
          passing_score: testData.passing_score || 75,
          time_limit_minutes: testData.time_limit_minutes,
          questions: questionsData || [],
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

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleOptionSelect = (questionId: string, option: string) => {
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
      const userAnswer = normalizeAnswer(
        answers[q.id] || "",
        q.answer_type || "text",
      );
      const correctAnswer = normalizeAnswer(
        q.correct_answer || "",
        q.answer_type || "text",
      );

      if (userAnswer === correctAnswer && userAnswer !== "") {
        correct++;
      }
    });

    return Math.round((correct / test.questions.length) * 100);
  };

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
    const calculatedScore = calculateScore();
    const testPassed = calculatedScore >= test.passing_score;

    setScore(calculatedScore);
    setPassed(testPassed);
    setSubmitted(true);

    if (isAuthenticated && user) {
      try {
        const details = test.questions.map((q) => ({
          question_id: q.id,
          question_type: q.question_type,
          user_answer: answers[q.id] || "",
          correct_answer: q.correct_answer || "",
          is_correct:
            normalizeAnswer(answers[q.id] || "", q.answer_type || "text") ===
            normalizeAnswer(q.correct_answer || "", q.answer_type || "text"),
        }));

        const { error } = await supabase.from("test_results").upsert(
          {
            user_id: user.id,
            test_id: test.id,
            score: calculatedScore,
            completed_at: new Date().toISOString(),
            answers: details,
          },
          { onConflict: "user_id,test_id" },
        );

        if (error) throw error;
        console.log("✅ Test result saved");
      } catch (err) {
        console.error("❌ Failed to save result:", err);
      }
    }

    setLoading(false);
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
