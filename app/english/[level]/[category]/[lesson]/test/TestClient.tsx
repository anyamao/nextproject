"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthListener } from "@/hooks/useAuthListener";
import useContactStore from "@/store/states";

interface Test {
  id: string;
  lesson_id?: string;
  passing_score: number;
  time_limit_seconds: number;
}

interface Question {
  id: string;
  test_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  order_index: number;
}

interface TestResult {
  score: number;
  total_questions: number;
  completed_at: string;
}

interface TestClientProps {
  level: string;
  category: string;
  lessonName: string;
}

export default function TestClient({
  level,
  category,
  lessonName,
}: TestClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuthListener();
  const { toggleLogin } = useContactStore();

  // UI States
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);

  // Test Flow States
  const [screen, setScreen] = useState<"intro" | "quiz" | "results">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch test data and last result
  useEffect(() => {
    async function fetchData() {
      try {
        console.log("🔍 Fetching test for:", { level, category, lessonName });

        // 1. Find lesson
        const { data: lesson } = await supabase
          .from("lessons")
          .select("id, name")
          .eq("name", lessonName)
          .single();

        if (!lesson) throw new Error("Lesson not found");

        // 2. Get test
        const { data: test } = await supabase
          .from("tests")
          .select("*")
          .eq("lesson_id", lesson.id)
          .single();

        if (!test) throw new Error("No test found");

        setTest(test);
        setTimeLeft(test.time_limit_seconds || 600);

        // 3. Get questions
        const { data: questions } = await supabase
          .from("test_questions")
          .select("*")
          .eq("test_id", test.id)
          .order("order_index", { ascending: true });

        if (questions) setQuestions(questions);

        // 4. Get user's last result (if authenticated)
        if (user) {
          const { data: result } = await supabase
            .from("test_results")
            .select("score, total_questions, completed_at")
            .eq("test_id", test.id)
            .eq("user_id", user.id)
            .order("completed_at", { ascending: false })
            .single();

          if (result) setLastResult(result);
        }
      } catch (error) {
        console.error("💥 Error loading test:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [lessonName, level, category, supabase, user]);

  // Timer for quiz mode
  useEffect(() => {
    if (screen !== "quiz" || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, isSubmitting]);

  // Start the test
  const startTest = () => {
    if (!user) {
      // Show nice login prompt instead of alert
      toggleLogin();
      return;
    }
    setScreen("quiz");
    setTimeLeft(test?.time_limit_seconds || 600);
    setCurrentIndex(0);
    setAnswers({});
  };

  // Handle answer selection
  const selectAnswer = (option: string) => {
    if (isSubmitting) return;
    const currentQ = questions[currentIndex];
    setAnswers({ ...answers, [currentQ.id]: option });
  };

  // Navigation
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Submit and calculate results
  const handleSubmitTest = async () => {
    if (!user || !test) {
      toggleLogin();
      return;
    }

    setIsSubmitting(true);

    // Calculate score
    let correctCount = 0;
    const userAnswersLog: Record<string, string> = {};

    questions.forEach((q) => {
      const userAns = answers[q.id];
      userAnswersLog[q.id] = userAns || "";
      if (userAns === q.correct_answer) correctCount++;
    });

    const score =
      questions.length > 0
        ? Math.round((correctCount / questions.length) * 100)
        : 0;
    const passed = score >= test.passing_score;

    try {
      // Save or update result
      await supabase.from("test_results").upsert(
        {
          test_id: test.id,
          user_id: user.id,
          score: score,
          total_questions: questions.length,
          answers: userAnswersLog,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "test_id,user_id",
        },
      );

      // Update local state and show results screen
      setLastResult({
        score,
        total_questions: questions.length,
        completed_at: new Date().toISOString(),
      });
      setScreen("results");
    } catch (error) {
      console.error("Error saving result:", error);
      alert("Could not save your result. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time helper
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading test...</div>
      </div>
    );
  }

  // Error state
  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Test Not Available
          </h2>
          <p className="text-gray-600 mb-4">У этого урока пока нет теста</p>
          <button
            onClick={() =>
              router.push(`/english/${level}/${category}/${lessonName}`)
            }
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            ← Back to Lesson
          </button>
        </div>
      </div>
    );
  }

  // ============ SCREEN: INTRO ============
  if (screen === "intro") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
            <h1 className="text-2xl font-bold mb-1">📝 Lesson Test</h1>
            <p className="text-blue-100">
              {lessonName.charAt(0).toUpperCase() + lessonName.slice(1)}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">
                  {questions.length}
                </div>
                <div className="text-xs text-gray-500 uppercase mt-1">
                  Questions
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600">
                  {formatTime(test.time_limit_seconds || 600)}
                </div>
                <div className="text-xs text-gray-500 uppercase mt-1">
                  Time Limit
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">
                  {test.passing_score}%
                </div>
                <div className="text-xs text-gray-500 uppercase mt-1">
                  To Pass
                </div>
              </div>
            </div>

            {/* Last Result Card */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">
                  Your Last Result
                </span>
                {lastResult && (
                  <span
                    className={`text-sm font-bold px-2 py-1 rounded ${
                      lastResult.score >= test.passing_score
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {lastResult.score >= test.passing_score
                      ? "✓ Passed"
                      : "✗ Try Again"}
                  </span>
                )}
              </div>
              {lastResult ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {lastResult.score}%
                  </span>
                  <span className="text-gray-500">
                    (
                    {lastResult.score >= test.passing_score
                      ? "Passed"
                      : "Not passed"}
                    )
                  </span>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Вы ещё не проходили этот тест
                </p>
              )}
            </div>

            {/* Login Prompt (if not authenticated) */}
            {!user && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 text-sm">
                  🔐 <strong>Sign in required</strong>
                  <br />
                  You need to be logged in to save your test results.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={startTest}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-md transition-all transform hover:scale-[1.02]"
              >
                {user ? "🚀 Start Test" : "🔐 Sign In & Start"}
              </button>

              <button
                onClick={() =>
                  router.push(`/english/${level}/${category}/${lessonName}`)
                }
                className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back to Lesson
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ SCREEN: QUIZ ============
  if (screen === "quiz") {
    const currentQ = questions[currentIndex];
    const currentAnswer = answers[currentQ.id];

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header with Timer */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setScreen("intro")}
            className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
          >
            ← Exit
          </button>

          <div
            className={`text-xl font-mono font-bold ${timeLeft < 60 ? "text-red-600 animate-pulse" : "text-gray-700"}`}
          >
            ⏱️ {formatTime(timeLeft)}
          </div>

          <div className="text-sm text-gray-500">
            Q{currentIndex + 1}/{questions.length}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-8 text-gray-800 leading-relaxed">
            {currentQ.question_text}
          </h2>

          <div className="space-y-3">
            {[
              { key: "a", text: currentQ.option_a },
              { key: "b", text: currentQ.option_b },
              { key: "c", text: currentQ.option_c },
              { key: "d", text: currentQ.option_d },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => selectAnswer(opt.key)}
                disabled={isSubmitting}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  currentAnswer === opt.key
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                } disabled:opacity-50`}
              >
                <span className="font-bold mr-3 text-lg">
                  {opt.key.toUpperCase()}.
                </span>
                {opt.text}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-white border-t px-6 py-4 flex justify-between items-center">
          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0 || isSubmitting}
            className="px-6 py-2 rounded-lg font-medium border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmitTest}
              disabled={
                isSubmitting || Object.keys(answers).length < questions.length
              }
              className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg shadow-sm transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============ SCREEN: RESULTS ============
  if (screen === "results" && lastResult) {
    const passed = lastResult.score >= (test?.passing_score || 75);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Result Header */}
          <div
            className={`px-6 py-8 text-center ${
              passed
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : "bg-gradient-to-r from-yellow-500 to-orange-600"
            } text-white`}
          >
            <div className="text-5xl mb-3">{passed ? "🎉" : "💪"}</div>
            <h1 className="text-2xl font-bold mb-1">
              {passed ? "Congratulations!" : "Good Effort!"}
            </h1>
            <p className="text-white/90">
              {passed ? "You passed the test!" : "Keep practicing to improve"}
            </p>
          </div>

          {/* Score Display */}
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-100 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {lastResult.score}%
                </div>
                <div className="text-sm text-gray-500">Your Score</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    questions.filter((q) => answers[q.id] === q.correct_answer)
                      .length
                  }
                </div>
                <div className="text-xs text-gray-500 uppercase">Correct</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <div className="text-2xl font-bold text-red-600">
                  {
                    questions.filter(
                      (q) =>
                        answers[q.id] && answers[q.id] !== q.correct_answer,
                    ).length
                  }
                </div>
                <div className="text-xs text-gray-500 uppercase">Incorrect</div>
              </div>
            </div>

            {/* Passing Info */}
            <div
              className={`p-4 rounded-xl mb-6 ${
                passed
                  ? "bg-green-50 text-green-800"
                  : "bg-yellow-50 text-yellow-800"
              }`}
            >
              <p className="font-medium">
                {passed
                  ? `✓ You scored ${lastResult.score}% (passing: ${test?.passing_score}%)`
                  : `✗ You need ${test?.passing_score}% to pass (you got ${lastResult.score}%)`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() =>
                  router.push(`/english/${level}/${category}/${lessonName}`)
                }
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors"
              >
                ← Back to Lesson
              </button>

              <button
                onClick={() => {
                  setScreen("quiz");
                  setCurrentIndex(0);
                  setAnswers({});
                  setTimeLeft(test?.time_limit_seconds || 600);
                }}
                className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
