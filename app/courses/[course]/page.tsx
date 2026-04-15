// app/ege/[subject]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
export async function generateStaticParams() {
  return [{ course: "unity-3d-first" }];
}

// Define a type to avoid `any` errors
type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
};

export default async function SubjectHubPage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course } = await params;

  const subjectData: Record<string, { name: string; description: string }> = {};

  const currentSubject = subjectData[course] || {
    name: course,
    description: "Предмет",
  };
  let lessons: Lesson[] = [];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const subjectRes = await fetch(
        `${supabaseUrl}/rest/v1/courses?select=id&slug=eq.${encodeURIComponent(course)}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: "no-store",
        },
      );
      const subData = await subjectRes.json();

      if (subData?.[0]?.id) {
        const lessonsRes = await fetch(
          `${supabaseUrl}/rest/v1/course_lessons?select=id,slug,title,description,estimated_minutes&course_id=eq.${subData[0].id}&is_published=eq.true`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            cache: "no-store",
          },
        );
        lessons = (await lessonsRes.json()) || [];
      }
    }
  } catch (err) {
    console.warn("⚠️ DB fetch skipped during static build");
  }

  return (
    <main className=" flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between w-full mb-6 h-full">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition"
        >
          <ArrowLeft className="w-6 h-6 cursor-pointer" />
        </Link>
        <div className="bigger-text font-semibold">{currentSubject.name}</div>
      </div>
      <p className="text-gray-600 mb-8">{currentSubject.description}</p>

      {lessons.length === 0 ? (
        <p className="text-gray-500">Пока нет доступных уроков.</p>
      ) : (
        <div className="grid gap-4 w-full h-full">
          {lessons.map((lesson) => {
            const lessonPart = lesson.slug.split("/").pop() || lesson.slug;
            return (
              <Link
                key={lesson.id}
                href={`/courses/${course}/${lessonPart}`}
                className="block p-[20px] bg-white hover:ml-[30px] duration-300 shadow-xs transition-all border-[1px]  border-gray-300 rounded-xl flex flex-row justify-between  transition"
              >
                <div className="flex flex-row">
                  <div className="bg-purple-400 h-full w-[5px]"></div>
                  <div className="flex flex-col ml-[10px] items-start">
                    <h2 className="ord-text font-semibold">{lesson.title}</h2>
                    <p className="text-gray-600 mt-1">{lesson.description}</p>
                    <span className="text-sm text-gray-600 mt-[5px] inline-block">
                      ⏱ {lesson.estimated_minutes ?? 30} мин
                    </span>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 mt-[15px] text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
