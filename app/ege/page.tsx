// app/ege/page.tsx
import Link from "next/link";
import { BookOpen, Calculator, Atom, Languages } from "lucide-react";

type Subject = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
};

// ✅ Static export safe: no dynamic params needed for root page
export const dynamic = "force-static";

export default async function EGEHubPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let subjects: Subject[] = [];
  let error: string | null = null;

  try {
    if (supabaseUrl && supabaseKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/subjects?select=id,slug,name,description,created_at&order=name`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          next: { revalidate: 3600 }, // Cache for 1 hour
        },
      );

      if (res.ok) {
        subjects = await res.json();
      } else {
        error = "Не удалось загрузить предметы";
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch subjects:", err);
    error = "Ошибка подключения к базе данных";
  }

  // Icon mapping for subjects
  const getSubjectIcon = (slug: string) => {
    switch (slug) {
      case "math":
      case "maths":
        return <Calculator className="w-8 h-8 text-purple-600" />;
      case "physics":
        return <Atom className="w-8 h-8 text-blue-600" />;
      case "russian":
      case "english":
        return <BookOpen className="w-8 h-8 text-amber-600" />;
      default:
        return <BookOpen className="w-8 h-8 text-gray-600" />;
    }
  };

  return (
    <main className=" flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="bigger-text font-bold mb-4">ЕГЭ Подготовка</p>
        <p className="text-gray-600 ord-text max-w-2xl mx-auto">
          Выберите предмет для начала подготовки. Каждый урок включает теорию,
          практические задания и тест для проверки знаний.
        </p>
      </div>

      {subjects.length === 0 && !error && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-20">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <p className="text-gray-500">
            Проверьте подключение к интернету или попробуйте позже
          </p>
        </div>
      )}

      {/* Subjects Grid */}
      {subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/ege/${subject.slug}`}
              className="group block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-purple-50 transition-colors">
                  {getSubjectIcon(subject.slug)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {subject.name}
                  </h2>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                    {subject.description || "Курс подготовки к ЕГЭ"}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">📚 Уроки</span>
                    <span className="flex items-center gap-1">📝 Тесты</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State - No subjects in DB */}
      {subjects.length === 0 && !error && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Предметы пока не добавлены
          </h3>
          <p className="text-gray-500 mb-6">
            Администратор ещё не добавил доступные предметы
          </p>
        </div>
      )}
    </main>
  );
}
