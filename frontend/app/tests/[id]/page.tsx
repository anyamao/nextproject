// frontend/app/tests/[id]/page.tsx
import TestClient from "./TestClient";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Test = {
  id: number;
  title: string;
  passing_score: number;
  questions: Array<{ id: number; question_text: string; order_index: number }>;
  lesson_id: number;
};

export const dynamic = "force-dynamic";

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const testId = parseInt(id, 10);

  // 🔍 Отладка на сервере
  console.log("🔍 [SERVER] TestPage params:", { id, testId });
  console.log("🔍 [SERVER] Fetching:", `/tests/${testId}`);

  try {
    const test: Test = await apiFetch(`/tests/${testId}`);

    console.log("🔍 [SERVER] Test received:", {
      id: test.id,
      title: test.title,
      questionsCount: test.questions?.length,
      lesson_id: test.lesson_id,
    });

    // Получаем slug урока для ссылки "назад"
    // (опционально: можно сделать отдельный эндпоинт /lessons/{id})
    const lessonSlug = "theory-of-probability-4"; // 🔧 Временно хардкод
    const subjectSlug = "math-profile"; // 🔧 Временно хардкод

    return (
      <TestClient
        test={test}
        lessonSlug={lessonSlug}
        subjectSlug={subjectSlug}
      />
    );
  } catch (error: any) {
    console.error("❌ [SERVER] Error fetching test:", {
      message: error?.message,
      status: error?.status,
      url: `/tests/${testId}`,
    });

    // Показываем ошибку в браузере для отладки
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          ❌ Ошибка загрузки теста
        </h1>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(
            {
              testId,
              error: error?.message || "Unknown error",
              stack: error?.stack,
            },
            null,
            2,
          )}
        </pre>
        <a
          href="/ege/math-profile"
          className="text-purple-600 hover:underline mt-4 inline-block"
        >
          ← Вернуться к урокам
        </a>
      </div>
    );

    // notFound(); // 🔧 Закомментируйте временно, чтобы видеть ошибку
  }
}
