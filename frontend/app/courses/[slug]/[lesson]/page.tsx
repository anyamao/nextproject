// frontend/app/courses/[slug]/[lesson]/page.tsx
"use client"; // ✅ Превращает в клиентский компонент

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LessonClient from "./LessonClient";
import { apiFetch } from "@/lib/api";

export default function CourseLessonPage() {
  const params = useParams();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const data = await apiFetch(`/courses/${params.slug}/${params.lesson}`);
        setLesson(data);
      } catch (err) {
        console.error("Failed to fetch lesson", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [params.slug, params.lesson]);

  if (loading || !lesson) {
    return <div className="p-10">Загрузка...</div>;
  }

  return (
    <LessonClient
      lesson={lesson}
      subjectSlug={params.slug as string}
      lessonSlug={params.lesson as string}
      testId={lesson.test_id ?? null}
    />
  );
}
