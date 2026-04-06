import Link from "next/link";
import { BookOpen, Clock, Trophy } from "lucide-react";

type LessonPreview = {
  slug: string;
  title: string;
  description: string;
  estimated_minutes: number;
  passing_score: number;
  clear_count: number;
  unclear_count: number;
  test_id: string | null;
};

export async function generateStaticParams() {
  return [{ level: "a2", category: "people" }];
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ level: string; category: string }>;
}) {
  const resolvedParams = await params;

  const level = resolvedParams.level?.toLowerCase() || "";
  const category = resolvedParams.category?.toLowerCase() || "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return <div className="text-center py-20">Configuration error</div>;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/lessons?select=slug,title,description,estimated_minutes,passing_score,clear_count,unclear_count,test_id&is_published=eq.true&order=title`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    return <div className="text-center py-20">Failed to load lessons</div>;
  }

  const result = await response.json();

  const allLessons: LessonPreview[] = Array.isArray(result) ? result : [];

  const lessons = allLessons.filter((lesson: LessonPreview) => {
    // slug = 'english/a2/people/grammar'
    const parts = lesson.slug.split("/");
    return (
      parts.length >= 4 &&
      parts[0] === "english" &&
      parts[1] === level &&
      parts[2] === category
    );
  });

  const breadcrumbs = [
    { label: "English", href: "/english" },
    { label: level.toUpperCase(), href: `/english/${level}` },
    { label: category, href: `/english/${level}/${category}` },
  ];

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full max-w-5xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 w-full">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-800 font-medium capitalize">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-purple-600 transition"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="mb-8 w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 capitalize">
          {category}
        </h1>
        <p className="text-gray-600">
          {level.toUpperCase()} • {lessons.length} уроков
        </p>
      </div>

      {lessons.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6 w-full">
          {lessons.map((lesson: LessonPreview) => {
            const lessonName = lesson.slug.split("/").pop() || "";
            const totalFeedback = lesson.clear_count + lesson.unclear_count;
            const feedbackRatio =
              totalFeedback > 0
                ? Math.round((lesson.clear_count / totalFeedback) * 100)
                : null;

            return (
              <Link
                key={lesson.slug}
                href={`/${lesson.slug}`}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition capitalize">
                      {lessonName}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {lesson.description}
                    </p>
                  </div>
                  <BookOpen className="text-purple-500 flex-shrink-0 ml-4" />
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{lesson.estimated_minutes} мин</span>
                  </div>
                  {lesson.test_id && (
                    <div className="flex items-center gap-1">
                      <Trophy size={16} />
                      <span>{lesson.passing_score}% для сдачи</span>
                    </div>
                  )}
                </div>

                {feedbackRatio !== null && (
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`px-2 py-1 rounded-full ${
                        feedbackRatio >= 75
                          ? "bg-green-100 text-green-700"
                          : feedbackRatio >= 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      👍 {feedbackRatio}% поняли
                    </span>
                    <span className="text-gray-400">
                      ({totalFeedback} оценок)
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg w-full">
          <p className="text-gray-500 mb-4">В этой категории пока нет уроков</p>
          <Link
            href={`/english/${level}`}
            className="text-purple-600 hover:underline"
          >
            ← Вернуться к {level.toUpperCase()}
          </Link>
        </div>
      )}
    </main>
  );
}
