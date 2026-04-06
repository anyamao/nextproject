"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, BookOpen, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

// ✅ Define Test type
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

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]); // ✅ Use Test[] instead of any[]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      // ✅ Use  { tests }
      const { data: tests, error } = await supabase
        .from("tests")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tests:", error);
        return;
      }

      if (tests) setTests(tests);
      setLoading(false);
    };

    fetchTests();
  }, []);

  if (loading) {
    return <div className="p-6">Загрузка тестов...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Доступные тесты</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
              onClick={() => router.push(`/tests/${test.id}`)}
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
      </div>
    </div>
  );
}
