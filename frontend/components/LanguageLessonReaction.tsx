// frontend/components/LanguageLessonReactions.tsx
"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface LanguageLessonReactionsProps {
  lessonId: number;
}

export default function LanguageLessonReactions({
  lessonId,
}: LanguageLessonReactionsProps) {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Загрузка реакций при монтировании
  const fetchReactions = async () => {
    try {
      const data = await apiFetch(`/languages-lessons/${lessonId}/reactions`);
      setLikes(data.likes);
      setDislikes(data.dislikes);
      setUserReaction(data.user_reaction);
    } catch {
      console.log("ℹ️ Could not fetch reactions");
    }
  };

  useState(() => {
    fetchReactions();
  }, [lessonId]);

  const handleReaction = async (type: "like" | "dislike") => {
    if (!localStorage.getItem("token")) {
      alert("Войдите, чтобы оценивать уроки!");
      return;
    }

    setLoading(true);
    try {
      // Если кликнул на уже выбранное — снимаем реакцию
      const newType = userReaction === type ? "none" : type;

      await apiFetch(`/languages-lessons/${lessonId}/reactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reaction_type: newType }),
      });

      // Перезагружаем статистику
      await fetchReactions();
    } catch (err) {
      console.error("Failed to set reaction", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => handleReaction("like")}
        disabled={loading}
        className={`flex items-center gap-1 text-sm transition ${
          userReaction === "like"
            ? "text-green-600 font-semibold"
            : "text-gray-500 hover:text-green-600"
        }`}
      >
        <ThumbsUp className="w-4 h-4" /> {likes}
      </button>
      <button
        onClick={() => handleReaction("dislike")}
        disabled={loading}
        className={`flex items-center gap-1 text-sm transition ${
          userReaction === "dislike"
            ? "text-red-600 font-semibold"
            : "text-gray-500 hover:text-red-600"
        }`}
      >
        <ThumbsDown className="w-4 h-4" /> {dislikes}
      </button>
    </div>
  );
}
