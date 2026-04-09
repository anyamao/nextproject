// app/languages/[language]/[level]/[category]/[lesson]/page.tsx
import LessonClient from "./LessonClient";
import { notFound } from "next/navigation";

type LessonData = {
  slug: string;
  language: { slug: string } | null;
  level: { code: string } | null;
  category: { slug: string } | null;
};

type RouteParam = {
  language: string;
  level: string;
  category: string;
  lesson: string;
};

export async function generateStaticParams(): Promise<RouteParam[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fallbackParams: RouteParam[] = [
    {
      language: "english",
      level: "a1",
      category: "greetings-introductions",
      lesson: "basic-greetings",
    },
  ];

  if (!supabaseUrl || !supabaseKey) {
    return fallbackParams;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/lessons?select=slug,language:languages(slug),level:levels(code),category:categories(slug)&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=representation",
        },
        cache: "no-store", // ✅ Disables Next.js caching for this request
        next: { revalidate: 0 },
      },
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch lessons for static params:",
        response.status,
      );
      return fallbackParams;
    }

    const lessons = await response.json();
    if (!lessons || lessons.length === 0) return fallbackParams;

    const params = lessons
      .map((lesson: LessonData): RouteParam | null => {
        if (
          lesson.language?.slug &&
          lesson.level?.code &&
          lesson.category?.slug
        ) {
          return {
            language: lesson.language.slug,
            level: lesson.level.code.toLowerCase(),
            category: lesson.category.slug,
            lesson: lesson.slug,
          };
        }
        return null;
      })
      .filter(
        (param: RouteParam | null): param is RouteParam => param !== null,
      );

    return params.length > 0 ? params : fallbackParams;
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return fallbackParams;
  }
}

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

  // Try BOTH slug formats
  const possibleSlugs = [
    lessonSlug, // Just "basic-greetings"
    `${language}/${level}/${category}/${lessonSlug}`, // Full path
  ];

  console.log("🔍 Server: Fetching lesson with params:", {
    language,
    level,
    category,
    lessonSlug,
    possibleSlugs,
  });

  let lesson = null;
  let lastError = null;

  for (const slug of possibleSlugs) {
    try {
      console.log(`🔍 Trying slug: "${slug}"`);

      const url = `${supabaseUrl}/rest/v1/lessons?select=*&slug=eq.${encodeURIComponent(slug)}&is_published=eq.true`;
      console.log("🔍 Request URL:", url);

      const response = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        next: { revalidate: 3600 },
      });

      console.log(`🔍 Response status for "${slug}":`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(
          `✅ Fetched data for "${slug}":`,
          JSON.stringify(data, null, 2),
        );

        // Supabase REST always returns an array
        if (Array.isArray(data) && data.length > 0) {
          lesson = data[0];
          console.log("✅ Found lesson:", lesson.slug);
          break;
        } else if (data && typeof data === "object" && !Array.isArray(data)) {
          // Edge case: single object
          lesson = data;
          console.log("✅ Found lesson (object):", lesson.slug);
          break;
        } else {
          console.log(`⚠️ No data found for slug: "${slug}"`);
        }
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Error for slug "${slug}":`,
          response.status,
          errorText,
        );
        lastError = { status: response.status, text: errorText };
      }
    } catch (error) {
      console.error(`❌ Exception fetching slug "${slug}":`, error);
      lastError = error;
    }
  }

  if (!lesson) {
    console.error(
      "❌ Lesson not found after trying all slugs. Last error:",
      lastError,
    );
    console.log("📋 Tried slugs:", possibleSlugs);

    // Debug: Try to fetch all lessons to see what's available
    try {
      const allLessonsUrl = `${supabaseUrl}/rest/v1/lessons?select=slug,title,is_published&is_published=eq.true&limit=10`;
      const allResponse = await fetch(allLessonsUrl, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      if (allResponse.ok) {
        const allLessons = await allResponse.json();
        console.log("📚 Available published lessons:", allLessons);
      }
    } catch (e) {
      console.error("Failed to fetch all lessons for debugging:", e);
    }

    notFound();
  }

  return (
    <LessonClient
      initialLesson={lesson}
      initialSlug={`${language}/${level}/${category}/${lessonSlug}`}
      params={resolvedParams}
    />
  );
}
