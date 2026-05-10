import TestClient from "./TestClient";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Test = {
  id: number;
  title: string;
  passing_score: number;
  questions: Array<{ id: number; question_text: string; order_index: number }>;
  lesson_id: number;
  lesson_slug?: string;
  subject_slug?: string;
};

export const dynamic = "force-dynamic";

export default async function TestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const testId = parseInt(id, 10);

  try {
    const test: Test = await apiFetch(`/tests/${testId}`);

    let lessonSlug = "";
    let subjectSlug = "";

    if (returnTo) {
      const match = returnTo.match(/\/courses\/([^\/]+)\/([^\/]+)/);
      if (match) {
        subjectSlug = match[1];
        lessonSlug = match[2];
      }
    }

    // Если не удалось извлечь из returnTo, используем данные из API
    if (
      (!lessonSlug || !subjectSlug) &&
      test.lesson_slug &&
      test.subject_slug
    ) {
      lessonSlug = test.lesson_slug;
      subjectSlug = test.subject_slug;
    }

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
  }
}
