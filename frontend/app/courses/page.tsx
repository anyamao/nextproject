// frontend/app/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Subject = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
};

const EGE_SLUGS = [
  "math-profile",
  "physics-ege",
  "russian-ege",
  "informatics-ege",
];

export default function CoursesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const data = await apiFetch("/ege/subjects"); // Берём все предметы
        // Фильтруем: оставляем ТОЛЬКО не-ЕГЭ
        const courses = data.filter(
          (s: Subject) => !EGE_SLUGS.includes(s.slug),
        );
        setSubjects(courses);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubjects();
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-5xl mx-auto">
      <div className="w-full mb-8">
        <Link
          href="/"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>На главную</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Курсы</h1>
        <p className="text-gray-600 mt-2">
          Практические курсы по программированию
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/courses/${subject.slug}`}
              className="group block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all"
            >
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700">
                {subject.title}
              </h2>
              {subject.description && (
                <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                  {subject.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Курсы пока не добавлены</p>
        </div>
      )}
    </main>
  );
}
