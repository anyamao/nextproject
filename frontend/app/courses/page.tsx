// frontend/app/courses/page.tsx

import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
type Course = {
  id: number; // 🔁 Теперь int
  slug: string;
  name: string;
  subject: string | null;
  description: string | null;
  image: string;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  let courses: Course[] = [];
  let error: string | null = null;

  try {
    // 🔁 Fetch к твоему FastAPI бэкенду
    const res = await fetch("http://localhost:8000/api/courses", {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await apiFetch("/api/courses");
      courses = data.courses;
    } else {
      error = "Не удалось загрузить курсы";
    }
  } catch (err) {
    console.error("❌ Failed to fetch courses:", err);
    error = "Ошибка подключения к серверу";
  }

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
          <p className="bigger-text font-bold">Наши курсы</p>
          <div></div>
        </div>
        <p className="text-gray-600 ord-text max-w-2xl mt-[20px] mx-auto">
          Здесь собраны курсы по разным направлениям
        </p>
      </div>

      {courses.length === 0 && !error && (
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

      {courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-[20px]">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gray-50 group-hover:bg-purple-50 transition-colors rounded-lg w-[100px] h-[130px] overflow-hidden">
                  <img
                    src={
                      course.image.startsWith("http")
                        ? course.image
                        : `/${course.image}`
                    }
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {course.subject && (
                    <p className="text-sm font-medium text-purple-600 mb-1">
                      {course.subject}
                    </p>
                  )}
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {course.name}
                  </h2>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                    {course.description || "Курс для изучения"}
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

      {courses.length === 0 && !error && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Курсы пока не добавлены
          </h3>
          <p className="text-gray-500 mb-6">
            Администратор ещё не добавил доступные курсы
          </p>
        </div>
      )}
    </main>
  );
}
