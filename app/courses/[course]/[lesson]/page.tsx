import LessonClient from "./LessonClient";
import { notFound } from "next/navigation";

type Course = {
  id: string;
  slug: string;
  name: string;
};

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const resolvedParams = await params;
  const { course: courseSlug, lesson: lessonSlug } = resolvedParams;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables");
    notFound();
  }

  try {
    // 1. Get course by slug to find course_id
    const courseRes = await fetch(
      `${supabaseUrl}/rest/v1/courses?select=id,slug,name&slug=eq.${encodeURIComponent(courseSlug)}&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      },
    );

    if (!courseRes.ok) {
      console.error("❌ Course fetch failed:", courseRes.status);
      notFound();
    }

    const courseData = await courseRes.json();
    const course: Course | undefined = Array.isArray(courseData)
      ? courseData[0]
      : courseData;

    if (!course) {
      console.error("❌ Course not found with slug:", courseSlug);
      notFound();
    }

    console.log("✅ Course found:", course.name, "ID:", course.id);

    const lessonRes = await fetch(
      `${supabaseUrl}/rest/v1/ege_lessons?select=*&course_id=eq.${course.id}&slug=eq.${encodeURIComponent(lessonSlug)}&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!lessonRes.ok) {
      console.error("❌ Lesson fetch failed:", lessonRes.status);
      notFound();
    }

    const lessonData = await lessonRes.json();
    const egeLesson = Array.isArray(lessonData) ? lessonData[0] : lessonData;

    if (!egeLesson) {
      console.error(
        "❌ No lesson found. Course ID:",
        course.id,
        "Slug:",
        lessonSlug,
      );

      const allLessonsRes = await fetch(
        `${supabaseUrl}/rest/v1/ege_lessons?select=slug,title&course_id=eq.${course.id}&is_published=eq.true`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );
      if (allLessonsRes.ok) {
        const allLessons = await allLessonsRes.json();
        console.log("📚 Available lessons in this course:", allLessons);
      }

      notFound();
    }

    console.log("✅ Lesson found:", egeLesson.title);

    const viewsRes = await fetch(
      `${supabaseUrl}/rest/v1/lesson_views?select=id&lesson_id=eq.${egeLesson.id}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    let viewCount = 0;
    if (viewsRes.ok) {
      const viewsData = await viewsRes.json();
      viewCount = Array.isArray(viewsData) ? viewsData.length : 0;
    }

    const lesson = {
      id: egeLesson.id,
      slug: egeLesson.slug,
      title: egeLesson.title,
      content: egeLesson.content,
      description: egeLesson.description || "",
      estimated_minutes: egeLesson.estimated_minutes || 30,
      passing_score: egeLesson.passing_score || 70,
      clear_count: egeLesson.clear_count || 0,
      unclear_count: egeLesson.unclear_count || 0,
      test_id: egeLesson.test_id || null,
      view_count: viewCount, // Add view count to lesson
    };

    return (
      <LessonClient
        initialLesson={lesson}
        initialSlug={`${courseSlug}/${lessonSlug}`}
        params={{
          course: courseSlug,
          lesson: lessonSlug,
        }}
      />
    );
  } catch (error) {
    console.error("❌ Error fetching lesson:", error);
    notFound();
  }
}
