// frontend/app/courses/[slug]/[lesson]/LessonClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import LessonReactions from "@/components/LessonReactions"; // или создай локально

type Lesson = {
  id: number; // ✅ Обязательно!
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
  const [viewCount, setViewCount] = useState<number | null>(null);

  // 👁️ Записать просмотр (только авторизованные)
  useEffect(() => {
    const recordView = async () => {
      const token = localStorage.getItem("token");
      if (!token || !lesson.id) return;

      try {
        const sessionKey = `viewed_lesson_${subjectSlug}_${lessonSlug}`;
        if (sessionStorage.getItem(sessionKey)) return;

        await apiFetch(`/lessons/${lesson.id}/view`, {
          // 🔁 Используем тот же эндпоинт, что для ЕГЭ
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        sessionStorage.setItem(sessionKey, "true");
      } catch (err) {
        console.log("ℹ️ View not recorded");
      }
    };
    recordView();
  }, [lesson.id, subjectSlug, lessonSlug]);

  // 👁️ Загрузить счётчик просмотров
  useEffect(() => {
    if (!lesson.id) return;
    const fetchViews = async () => {
      try {
        const data = await apiFetch(`/lessons/${lesson.id}/views`);
        setViewCount(data.view_count);
      } catch {}
    };
    fetchViews();
  }, [lesson.id]);

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      <Link
        href={`/courses/${subjectSlug}`}
        className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="w-5 h-5" /> Назад к курсу
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>

      {lesson.content ? (
        <article
          className="prose prose-purple max-w-none w-full text-gray-800"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      ) : (
        <p className="text-gray-500 italic">Контент скоро появится</p>
      )}

      {/* 👍👎👁️ Реакции и просмотры */}
      {lesson.id && (
        <div className="mt-8 pt-6 border-t border-gray-200 w-full">
          {/* ✅ КЛЮЧ: форсирует полный ремount при смене урока или F5 */}
          <LessonReactions key={`stats-${lesson.id}`} lessonId={lesson.id} />
        </div>
      )}
    </main>
  );
}
