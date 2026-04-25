import LessonClient from "./LessonClient";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Lesson = {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  description: string | null;
  estimated_minutes: number;
  order_number: number;
  view_count: number;
};

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{
    language: string;
    level: string;
    category: string;
    lesson: string;
  }>;
}) {
  const { language, level, category, lesson: lessonSlug } = await params;

  try {
    const levelCode = level.toUpperCase();

    // 🔁 Fetch урока напрямую (бэкенд сам проверит всю цепочку)
    const lessonData: Lesson = await apiFetch(
      `/api/languages/${language}/levels/${levelCode}/categories/${category}/lessons/${lessonSlug}`,
    );

    // 🔁 Форматируем для LessonClient (совместимость с EGE версией)
    const formattedLesson = {
      id: lessonData.id.toString(), // LessonClient ожидает string
      slug: lessonData.slug,
      title: lessonData.title,
      content: lessonData.content || "",
      description: lessonData.description || "",
      level: level,
      category: category,
      test_id: null, // Пока заглушка — можно добавить позже
      estimated_minutes: lessonData.estimated_minutes || 30,
      passing_score: 75, // Заглушка
      clear_count: 0, // Будет обновлено клиентом из FastAPI
      unclear_count: 0,
      view_count: lessonData.view_count || 0,
    };

    return (
      <LessonClient
        initialLesson={formattedLesson}
        initialSlug={`${language}/${level}/${category}/${lessonSlug}`}
        params={{ language, level, category, lesson: lessonSlug }}
        isLanguageLesson={true} // 🔁 Флаг для переключения логики
      />
    );
  } catch (error) {
    console.error("❌ Error fetching lesson:", error);
    notFound();
  }
}
