// app/english/[level]/[category]/[lesson]/page.tsx

import LessonClient from "./LessonClient";
import { notFound } from "next/navigation";

type LessonData = {
  id: string;
  slug: string;
  level: string;
  category: string;
  title: string;
  content: string;
  description: string;
  estimated_minutes: number;
  passing_score: number;
  clear_count: number;
  unclear_count: number;
  test_id: string | null;
};

// app/english/[level]/[category]/[lesson]/page.tsx

export async function generateStaticParams(): Promise<
  Array<{ level: string; category: string; lesson: string }>
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ✅ Fallback: Return known params even if DB fetch fails
  const fallbackParams = [
    { level: "a2", category: "people", lesson: "grammar" },
    { level: "a2", category: "people", lesson: "vocabulary" },
    { level: "a2", category: "people", lesson: "reading" },
  ];

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase env vars missing - using fallback params");
    return [{ level: "a2", category: "people", lesson: "grammar" }];
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/lessons?select=slug,level,category&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!response.ok) {
      console.warn("Failed to fetch lessons - using fallback params");
      return [{ level: "a2", category: "people", lesson: "grammar" }];
    }

    const lessons: { slug: string; level: string; category: string }[] =
      await response.json();

    if (!lessons || lessons.length === 0) {
      console.warn("No lessons found - using fallback params");
      return [{ level: "a2", category: "people", lesson: "grammar" }];
    }

    // Transform slugs into params
    const params = lessons
      .map((lesson) => {
        const parts = lesson.slug.split("/");
        if (parts.length >= 4 && parts[0] === "english") {
          return {
            level: parts[1],
            category: parts[2],
            lesson: parts[3],
          };
        }
        return null;
      })
      .filter(
        (param): param is { level: string; category: string; lesson: string } =>
          param !== null,
      );

    console.log("✅ Generated static params:", params);
    return params.length > 0 ? params : fallbackParams;
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return fallbackParams;
  }
}
export default async function LessonPage({
  params,
}: {
  params: Promise<{ level: string; category: string; lesson: string }>;
}) {
  const resolvedParams = await params;

  const level = resolvedParams.level?.toLowerCase() || "";
  const category = resolvedParams.category?.toLowerCase() || "";
  const lessonSlug = resolvedParams.lesson?.toLowerCase() || "";

  const fullSlug = `english/${level}/${category}/${lessonSlug}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase env vars");
    notFound();
  }

  console.log("🔍 Server: Fetching lesson with slug:", fullSlug);

  // Fetch lesson by exact slug match
  const response = await fetch(
    // ✅ Correct (uses dynamic params)
    `${supabaseUrl}/rest/v1/lessons?select=*&slug=eq.${encodeURIComponent(fullSlug)}&is_published=eq.true`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 3600 },
    },
  );

  console.log("🔍 Server: Response status:", response.status);

  if (!response.ok) {
    console.error("❌ Server: Failed to fetch lesson:", response.status);
    notFound();
  }

  const result = await response.json();
  console.log("🔍 Server: Fetched lesson:", result);

  const lesson = Array.isArray(result) ? result[0] : result;

  if (!lesson) {
    console.warn("⚠️ Server: Lesson not found:", fullSlug);
    notFound();
  }

  return (
    <LessonClient
      initialLesson={lesson}
      initialSlug={fullSlug}
      params={resolvedParams}
    />
  );
}
