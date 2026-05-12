// frontend/app/courses/[slug]/[lesson]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LessonClient from "./LessonClient";
import { apiFetch } from "@/lib/api";

type Lesson = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  time_minutes: number | null;
  test_id: number | null;
  is_locked?: boolean; // 🔥 Новое поле
};

export default function CourseLessonPage() {
  const params = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // frontend/app/courses/[slug]/[lesson]/page.tsx

  // frontend/app/courses/[slug]/[lesson]/page.tsx

  useEffect(() => {
    async function fetchLesson() {
      try {
        const courseData = await apiFetch(`/courses/${params.slug}`);
        const foundLesson = courseData.lessons.find(
          (l: Lesson) => l.slug === params.lesson,
        );

        if (!foundLesson) {
          throw new Error("Lesson not found");
        }

        // 🔥 ЛОГИ: смотри в консоль браузера
        console.log("🔍 [page.tsx] foundLesson:", {
          slug: foundLesson.slug,
          is_locked: foundLesson.is_locked,
          id: foundLesson.id,
        });

        const locked = !!foundLesson.is_locked;
        setIsLocked(locked);
        console.log("🔍 [page.tsx] isLocked set to:", locked);

        // 🔥 Если заблокирован — НЕ загружаем детали урока
        if (locked) {
          console.log(
            "🔒 [page.tsx] Lesson is locked, skipping /lessons/{id} fetch",
          );
          setLoading(false);
          return;
        }

        // Загружаем детали только если не заблокирован
        const lessonData = await apiFetch(`/lessons/${foundLesson.id}`);
        console.log("✅ [page.tsx] Lesson data loaded:", { id: lessonData.id });
        setLesson(lessonData);
      } catch (err) {
        console.error("❌ Failed to load lesson:", err);
      } finally {
        setLoading(false);
      }
    }

    if (params.slug && params.lesson) {
      fetchLesson();
    }
  }, [params.slug, params.lesson]);

  if (loading) {
    return <div className="p-10 text-center">Загрузка урока...</div>;
  }

  if (!lesson && !isLocked) {
    return <div className="p-10 text-center text-red-600">Урок не найден</div>;
  }

  return (
    <LessonClient
      lesson={lesson}
      subjectSlug={params.slug as string}
      lessonSlug={params.lesson as string}
      testId={lesson?.test_id ?? null}
      isLocked={isLocked} // 🔥 Передаём флаг блокировки
    />
  );
}
