"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Clock, BookOpen, Trophy, Loader2 } from "lucide-react";
import TestTaking from "@/ui/TestTaking";

interface Test {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  duration_minutes: number;
  passing_score: number;
  is_active: boolean;
  created_at: string;
}

interface TestResult {
  testId: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
}

export default function TestsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const testId = searchParams.get("id");
  const error = searchParams.get("error");

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const [testExists, setTestExists] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!testId) return;

    setVerifying(true);

    const checkTest = async () => {
      const { data, error } = await supabase
        .from("tests")
        .select("id, is_active")
        .eq("id", testId)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        router.push("/tests?error=invalid_test");
        return;
      }

      setTestExists(true);
      setVerifying(false);
    };

    checkTest();
  }, [testId, router]);

  useEffect(() => {
    if (testId) return;

    const fetchTests = async () => {
      try {
        const { data: tests, error } = await supabase
          .from("tests")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (tests) setTests(tests);
      } catch (err) {
        console.error("Error fetching tests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [testId]);

  if (testId) {
    if (verifying) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] bg-gray-100">
          <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
          <p className="ml-4 text-gray-600">Проверка теста...</p>
        </div>
      );
    }
    const returnUrl = searchParams.get("returnUrl") || "/tests";

    if (!testExists) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] bg-gray-100">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              ❌ Тест не найден или не активен
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Вернуться к списку тестов
            </button>
          </div>
        </div>
      );
    }

    const handleComplete = (result: TestResult): void => {
      console.log("Test completed:", result);
    };

    return (
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-3xl mx-auto px-6 mb-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            ← Назад к списку тестов
          </button>
        </div>

        <TestTaking testId={testId} onComplete={handleComplete} />
      </div>
    );
  }

  if (error === "invalid_test") {
    return (
      <div className="min-h-screen bg-gray-100 py-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-600 mb-4">⚠️ Ссылка на тест недействительна</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Вернуться к списку тестов
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600">Загрузка тестов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Доступные тесты</h1>

        {tests.length === 0 ? (
          <p className="text-gray-500">
            Пока нет доступных тестов. Заходите позже!
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                onClick={() => router.push(`/tests?id=${test.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">{test.title}</h2>
                    <p className="text-gray-600 text-sm">{test.description}</p>
                  </div>
                  <BookOpen className="text-purple-500" />
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{test.duration_minutes} мин</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy size={16} />
                    <span>{test.passing_score}% для сдачи</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {test.subject}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {test.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
