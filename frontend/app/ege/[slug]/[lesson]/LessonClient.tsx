// frontend/app/ege/[slug]/[lesson]/LessonClient.tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Lesson = {
  title: string;
  description: string | null;
  content: string | null;
  time_minutes: number | null;
};

interface LessonClientProps {
  lesson: Lesson;
  subjectSlug: string;
  lessonSlug: string;
  testId: number | null;
}

export default function LessonClient({
  lesson,
  subjectSlug,
  lessonSlug,
  testId,
}: LessonClientProps) {
  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      {/* 🔙 Назад */}
      <Link
        href={`/ege/${subjectSlug}`}
        className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-6 self-start"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Все уроки</span>
      </Link>

      {/* 📌 Заголовок */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>

      {lesson.time_minutes && (
        <p className="text-gray-500 text-sm mb-6">
          ~{lesson.time_minutes} минут
        </p>
      )}

      {lesson.description && (
        <p className="text-gray-700 text-lg mb-8 leading-relaxed">
          {lesson.description}
        </p>
      )}

      {/* 📄 Контент */}
      {lesson.content ? (
        <article
          className="prose prose-purple max-w-none w-full text-gray-800"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      ) : (
        <p className="text-gray-500 italic">Контент урока пока не добавлен</p>
      )}

      {/* 📝 Кнопка теста (только если testId есть) */}
      {testId && (
        <Link
          href={`/tests/${testId}`}
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition shadow-sm"
        >
          📝 Пройти тест
        </Link>
      )}
    </main>
  );
}
