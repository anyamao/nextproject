import LessonClient from "./LessonClient";
import { notFound } from "next/navigation";

type LessonData = {
  id: string;
  slug: string;
  title: string;
  content: string;
  description: string;
  level: string;
  category: string;
  test_id: string | null;
  estimated_minutes: number;
  passing_score: number;
  clear_count: number;
  unclear_count: number;
  view_count: number; // Add this line
};

type RouteParam = {
  language: string;
  level: string;
  category: string;
  lesson: string;
};

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<RouteParam>;
}) {
  const resolvedParams = await params;
  const { language, level, category, lesson: lessonSlug } = resolvedParams;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables");
    notFound();
  }

  console.log("🔍 Server: Fetching lesson with params:", {
    language,
    level,
    category,
    lessonSlug,
  });

  try {
    const langRes = await fetch(
      `${supabaseUrl}/rest/v1/languages?select=id&slug=eq.${encodeURIComponent(language)}&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      },
    );
    const languageData = await langRes.json();
    const languageId = languageData?.[0]?.id;

    if (!languageId) {
      console.error("❌ Language not found:", language);
      notFound();
    }
    console.log("✅ Language ID:", languageId);

    const levelRes = await fetch(
      `${supabaseUrl}/rest/v1/levels?select=id&code=eq.${level.toUpperCase()}&language_id=eq.${languageId}&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      },
    );
    const levelData = await levelRes.json();
    const levelId = levelData?.[0]?.id;

    if (!levelId) {
      console.error("❌ Level not found:", level);
      notFound();
    }
    console.log("✅ Level ID:", levelId);

    const catRes = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=id&slug=eq.${encodeURIComponent(category)}&language_id=eq.${languageId}&level_id=eq.${levelId}&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      },
    );
    const categoryData = await catRes.json();
    const categoryId = categoryData?.[0]?.id;

    if (!categoryId) {
      console.error("❌ Category not found:", category);
      notFound();
    }
    console.log("✅ Category ID:", categoryId);

    const lessonRes = await fetch(
      `${supabaseUrl}/rest/v1/ege_lessons?select=*&slug=eq.${encodeURIComponent(lessonSlug)}&language_id=eq.${languageId}&level_id=eq.${levelId}&category_id=eq.${categoryId}&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      },
    );

    if (!lessonRes.ok) {
      console.error("❌ Lesson fetch failed:", lessonRes.status);
      notFound();
    }

    const lessonData = await lessonRes.json();
    const lesson = Array.isArray(lessonData) ? lessonData[0] : lessonData;

    if (!lesson) {
      console.error("❌ Lesson not found with slug:", lessonSlug);

      const allLessonsRes = await fetch(
        `${supabaseUrl}/rest/v1/ege_lessons?select=slug,title&language_id=eq.${languageId}&level_id=eq.${levelId}&category_id=eq.${categoryId}&is_published=eq.true`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );
      if (allLessonsRes.ok) {
        const allLessons = await allLessonsRes.json();
        console.log("📚 Available lessons in this category:", allLessons);
      }

      notFound();
    }

    console.log("✅ Lesson found:", lesson.title);

    const viewsRes = await fetch(
      `${supabaseUrl}/rest/v1/lesson_views?select=id&lesson_id=eq.${lesson.id}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      },
    );

    let viewCount = 0;
    if (viewsRes.ok) {
      const viewsData = await viewsRes.json();
      viewCount = Array.isArray(viewsData) ? viewsData.length : 0;
    }

    const formattedLesson: LessonData = {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      content: lesson.content,
      description: lesson.description || "",
      level: level,
      category: category,
      test_id: lesson.test_id || null,
      estimated_minutes: lesson.estimated_minutes || 30,
      passing_score: lesson.passing_score || 75,
      clear_count: lesson.clear_count || 0,
      unclear_count: lesson.unclear_count || 0,
      view_count: viewCount, // Add the view count
    };

    return (
      <LessonClient
        initialLesson={formattedLesson}
        initialSlug={`${language}/${level}/${category}/${lessonSlug}`}
        params={resolvedParams}
      />
    );
  } catch (error) {
    console.error("❌ Error fetching lesson:", error);
    notFound();
  }
}
