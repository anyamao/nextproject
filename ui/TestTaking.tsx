"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
  points: number;
  answers: Answer[];
}

interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
}

interface TestTakingProps {
  testId: string;
  onComplete?: (result: TestResult) => void;
}

interface TestResult {
  testId: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
}

export default function TestTaking({ testId, onComplete }: TestTakingProps) {
  const router = useRouter();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // question_id -> answer_id
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        // ✅ Fetch test metadata - use  { test }
        const { data: test, error: testError } = await supabase
          .from("tests")
          .select("*")
          .eq("id", testId)
          .single();

        if (testError || !test) throw testError;
        setTest(test);
        setTimeRemaining(test.duration_minutes * 60);

        // ✅ Fetch questions - use  { questions }
        const { data: questions, error: questionsError } = await supabase
          .from("questions")
          .select(
            `
          *,
          answers (
            id,
            answer_text,
            is_correct,
            order_index
          )
        `,
          )
          .eq("test_id", testId)
          .order("order_index", { ascending: true });

        if (questionsError) throw questionsError;
        setQuestions(questions || []);
      } catch (err) {
        console.error("Fetch test error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId]);
  // Timer
  useEffect(() => {
    if (loading || testCompleted || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitTest(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, testCompleted, timeRemaining]);

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const goToPrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
  };

  const calculateScore = () => {
    let correctCount = 0;
    let totalPoints = 0;

    questions.forEach((question) => {
      totalPoints += question.points;
      const selectedAnswerId = answers[question.id];
      const correctAnswer = question.answers.find((a) => a.is_correct);

      if (selectedAnswerId === correctAnswer?.id) {
        correctCount += question.points;
      }
    });

    return totalPoints > 0 ? Math.round((correctCount / totalPoints) * 100) : 0;
  };

  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const score = calculateScore();
      const passed = score >= (test?.passing_score || 70);

      const { error } = await supabase.from("test_results").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        test_id: testId,
        score,
        passed,
        answers,
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;

      const testResult: TestResult = {
        testId,
        score,
        passed,
        answers,
      };

      setResult(testResult);
      setTestCompleted(true);

      if (onComplete) onComplete(testResult);
    } catch (err) {
      console.error("Submit test error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
        <p className="ml-4 text-gray-600">Загрузка теста...</p>
      </div>
    );
  }

  if (testCompleted && result) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          {result.passed ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold mb-2">
            {result.passed ? "🎉 Поздравляем!" : "😔 Не сдали"}
          </h2>
          <p className="text-gray-600 mb-4">{test?.title}</p>

          <div className="text-4xl font-bold mb-2">{result.score}%</div>
          <p className="text-sm text-gray-500">
            Проходной балл: {test?.passing_score}%
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Вернуться к тестам
          </button>

          {onComplete && (
            <button
              onClick={() => onComplete(result)}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Продолжить
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{test?.title}</h1>
          <p className="text-sm text-gray-500">
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeRemaining < 300
              ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <Clock size={20} />
          <span className="font-mono font-bold">
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {currentQuestionIndex + 1}. {currentQuestion?.question_text}
        </h2>

        <div className="space-y-3">
          {currentQuestion?.answers.map((answer) => (
            <button
              key={answer.id}
              onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                answers[currentQuestion.id] === answer.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestion.id] === answer.id
                      ? "border-purple-500 bg-purple-500"
                      : "border-gray-300"
                  }`}
                >
                  {answers[currentQuestion.id] === answer.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span>{answer.answer_text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={20} /> Назад
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitTest}
            disabled={
              isSubmitting || Object.keys(answers).length < questions.length
            }
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <CheckCircle />
            )}
            Завершить тест
          </button>
        ) : (
          <button
            onClick={goToNext}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Далее <ChevronRight size={20} />
          </button>
        )}
      </div>

      {currentQuestionIndex === questions.length - 1 &&
        Object.keys(answers).length < questions.length && (
          <p className="text-sm text-orange-600 mt-4 text-center">
            ⚠️ Вы ответили на {Object.keys(answers).length} из{" "}
            {questions.length} вопросов
          </p>
        )}
    </div>
  );
}
