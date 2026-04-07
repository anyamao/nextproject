// app/tests/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useContactStore from "@/store/states";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";

type TestQuestion = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  order_index: number;
};
type TestQuestionDB = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  order_index: number;
};

type TestData = {
  id: string;
  passing_score: number;
  time_limit_seconds?: number;
  questions: TestQuestion[];
};

function TestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useContactStore();

  const testId = searchParams.get("id");
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  // Fetch test data
  useEffect(() => {
    if (!testId) {
      setError("No test ID provided");
      setLoading(false);
      return;
    }

    console.log("🔍 Fetching test:", testId);

    const fetchTest = async () => {
      try {
        // 1. Fetch test info
        const { data: testData, error: testError } = await supabase
          .from("tests")
          .select("id,  passing_score, time_limit_seconds")
          .eq("id", testId)
          .single();

        if (testError || !testData) {
          console.error("❌ Test fetch error:", testError);
          setError("Test not found");
          setLoading(false);
          return;
        }

        console.log("✅ Test data:", testData);

        // 2. Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("test_questions")
          .select(
            "id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_index",
          )
          .eq("test_id", testId)
          .order("order_index", { ascending: true });

        if (questionsError) {
          console.error("❌ Questions fetch error:", questionsError);
          setError("Failed to load questions");
          setLoading(false);
          return;
        }

        console.log("✅ Questions:", questionsData);

        // 3. Transform questions to match expected format
        const transformedQuestions: TestQuestion[] = (questionsData || []).map(
          (q: TestQuestionDB) => ({
            id: q.id,
            question: q.question_text,
            options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(
              Boolean,
            ),
            correct_answer: q.correct_answer,
            order_index: q.order_index,
          }),
        );
        setTest({
          id: testData.id,
          passing_score: testData.passing_score || 70,
          time_limit_seconds: testData.time_limit_seconds,
          questions: transformedQuestions,
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

  const calculateScore = () => {
    if (!test) return 0;
    let correct = 0;
    test.questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    return Math.round((correct / test.questions.length) * 100);
  };

  const handleSubmit = async () => {
    if (!test) return;

    setLoading(true);
    const calculatedScore = calculateScore();
    const testPassed = calculatedScore >= test.passing_score;

    setScore(calculatedScore);
    setPassed(testPassed);
    setSubmitted(true);

    // Save result
    if (isAuthenticated && user) {
      try {
        const { error } = await supabase.from("test_results").upsert(
          {
            user_id: user.id,
            test_id: test.id,
            score: calculatedScore,
            total_questions: test.questions.length,
            answers: answers, // Save which answers user selected
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,test_id" },
        );

        if (error) {
          console.error("❌ Save error:", error);
          throw error;
        }
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
        <p className="ml-4">Загрузка теста...</p>
      </div>
    );
  }

  // Error state
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
            className="bg-purple-600 text-white px-6 py-2 rounded-lg"
          >
            Вернуться к уроку
          </button>
        </div>
      </div>
    );
  }

  // Results screen
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
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
          >
            Вернуться к уроку
          </button>
        </div>
      </main>
    );
  }

  // Quiz screen
  const question = test.questions[currentQuestion];
  const progress = Math.round(
    ((currentQuestion + 1) / test.questions.length) * 100,
  );

  return (
    <main className="flex-1 flex flex-col items-center px-[20px] py-[30px] w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-4"></div>
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

      {/* Question */}
      <div className="bg-white rounded-xl shadow-lg p-6 w-full mb-6">
        <p className="text-lg font-medium mb-4">{question.question}</p>
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const optionLetter = String.fromCharCode(97 + idx); // a, b, c, d
            const isSelected = answers[question.id] === optionLetter;
            return (
              <button
                key={idx}
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: optionLetter,
                  }))
                }
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
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Назад
        </button>

        {currentQuestion < test.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion((prev) => prev + 1)}
            disabled={!answers[question.id]}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Далее →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={
              Object.keys(answers).length < test.questions.length || loading
            }
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
