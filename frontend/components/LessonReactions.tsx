// frontend/components/LessonReactions.tsx
"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function LessonReactions({ lessonId }: { lessonId: number }) {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myReaction, setMyReaction] = useState<"like" | "dislike" | null>(null);
  const [loading, setLoading] = useState(false);
  const [views, setViews] = useState(0);
  // 📥 Загрузка статистики при открытии
  // frontend/components/LessonReactions.tsx (или где он у тебя лежит)

  useEffect(() => {
    if (!lessonId) {
      console.warn("⚠️ lessonId is missing, skipping stats fetch");
      return;
    }

    console.log("🔄 [LessonReactions] Mounting for lessonId:", lessonId);

    const fetchStats = async () => {
      setLoading(true);
      try {
        // ✅ Добавляем timestamp чтобы браузер/Next.js не отдавали кэш
        const res = await apiFetch(
          `/lessons/${lessonId}/stats?t=${Date.now()}`,
          {
            cache: "no-store", // ✅ Явно запрещаем кэширование
          },
        );

        console.log("✅ Stats received:", res);
        setLikes(res.likes);
        setDislikes(res.dislikes);
        setMyReaction(res.user_reaction);

        // Если views в отдельном эндпоинте:
        const viewsRes = await apiFetch(
          `/lessons/${lessonId}/views?t=${Date.now()}`,
        );
        setViews(viewsRes.view_count);
      } catch (err) {
        console.error("❌ Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [lessonId]); // ✅ Зависимость только от lessonId
  // 👍👎 Обработчик клика
  const handleReaction = async (type: "like" | "dislike") => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Войдите, чтобы оценивать уроки!");
      return;
    }

    // Логика: если кликнул на то, что уже выбрано — снимаем голос
    const newReaction = myReaction === type ? "none" : type;

    setLoading(true);
    try {
      await apiFetch(`/lessons/${lessonId}/reaction`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reaction_type: newReaction }),
      });

      // Обновляем UI оптимистично (или заново подгружаем)
      const data = await apiFetch(`/lessons/${lessonId}/stats`);
      setLikes(data.likes);
      setDislikes(data.dislikes);
      setMyReaction(data.user_reaction);
    } catch (err) {
      console.error("Reaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row items-center ">
      <button
        onClick={() => handleReaction("like")}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
          myReaction === "like"
            ? "bg-green-100 border-green-300 text-green-700 shadow-sm"
            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <ThumbsUp className="w-[15px] h-[15px]" />
        <span className="font-bold smaller-text">{likes}</span>
      </button>

      {/* 👎 Дизлайк */}
      <button
        onClick={() => handleReaction("dislike")}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 ml-[10px] rounded-full border transition-all ${
          myReaction === "dislike"
            ? "bg-red-100 border-red-300 text-red-700 shadow-sm"
            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <ThumbsDown className="w-[15px] h-[15px]" />
        <span className="font-bold smaller-text">{dislikes}</span>
      </button>
    </div>
  );
}
