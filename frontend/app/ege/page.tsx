// frontend/app/ege/page.tsx

import Link from "next/link";
import { BookOpen, Calculator, Atom, Languages, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api"; // ✅ Универсальный fetch для dev/prod

type Subject = {
  id: number; // 🔁 Теперь int (из FastAPI)
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function EGEHubPage() {
  let subjects: Subject[] = [];
  let error: string | null = null;

  try {
    // 🔁 Fetch к твоему FastAPI бэкенду
    const data = await apiFetch("/api/ege/subjects");
    subjects = data.courses;
  } catch (err) {
    console.error("❌ Failed to fetch EGE subjects:", err);
    error = "Не удалось загрузить предметы";
  }

  // 🎨 Иконки для предметов (обновлённые slug'и!)
  const getSubjectIcon = (slug: string) => {
    switch (slug) {
      case "math-profile-ege": // ✅ Было "math"
        return <Calculator className="w-8 h-8 text-purple-600" />;
      case "physics-ege": // ✅ Было "physics"
        return <Atom className="w-8 h-8 text-blue-600" />;
      case "russian-ege": // ✅ Было "russian"
        return <Languages className="w-8 h-8 text-amber-600" />;
      case "informatics-ege": // ✅ Было "informatics"
        return <BookOpen className="w-8 h-8 text-green-600" />;
      default:
        return <BookOpen className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      <div className="w-full">
        <div className="flex flex-row w-full items-center justify-between">
          <Link
            href="/"
            className="text-gray-600 hover:text-purple-600 transition"
          >
            <ArrowLeft className="w-6 h-6 cursor-pointer" />
          </Link>
          <p className="bigger-text font-bold">ЕГЭ Подготовка</p>
          <div></div>
        </div>
        <p className="text-gray-600 ord-text max-w-2xl mt-[20px] mx-auto">
          Выберите предмет для начала подготовки. Каждый урок включает теорию,
          практические задания и тест для проверки знаний. :)
        </p>
      </div>

      {subjects.length === 0 && !error && (
        <div className="flex justify-center py-20 mt-[20px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <p className="text-gray-500">
            Проверьте подключение к интернету или попробуйте позже
          </p>
        </div>
      )}

      {subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-[20px]">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/ege/${subject.slug}`} // 🔁 Теперь slug = "math-profile-ege"
              className="group block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-purple-50 transition-colors">
                  {getSubjectIcon(subject.slug)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {subject.name}
                  </h2>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                    {subject.description || "Курс подготовки к ЕГЭ"}
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

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
