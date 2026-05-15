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
  is_locked?: boolean;
};

export default function CourseLessonPage() {
  const params = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

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

        const locked = !!foundLesson.is_locked;
        setIsLocked(locked);

        if (locked) {
          setLoading(false);
          return;
        }

        const lessonData = await apiFetch(`/lessons/${foundLesson.id}`);
        setLesson(lessonData);
      } catch (err) {
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
      isLocked={isLocked}
    />
  );
}
