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

  // 📥 Загрузка статистики при открытии
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch(`/lessons/${lessonId}/stats`);
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setMyReaction(data.user_reaction);
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, [lessonId]);

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
    <div className="flex items-center gap-4 py-4 border-t border-gray-200 mt-8">
      <p className="text-sm font-medium text-gray-500 mr-2">Вам помог урок?</p>

      {/* 👍 Лайк */}
      <button
        onClick={() => handleReaction("like")}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
          myReaction === "like"
            ? "bg-green-100 border-green-300 text-green-700 shadow-sm"
            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="font-bold">{likes}</span>
      </button>

      {/* 👎 Дизлайк */}
      <button
        onClick={() => handleReaction("dislike")}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
          myReaction === "dislike"
            ? "bg-red-100 border-red-300 text-red-700 shadow-sm"
            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <ThumbsDown className="w-4 h-4" />
        <span className="font-bold">{dislikes}</span>
      </button>
    </div>
  );
}
