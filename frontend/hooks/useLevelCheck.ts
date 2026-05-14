// frontend/hooks/useLevelCheck.ts
"use client";

import { useCallback } from "react";
import { getAchievements, type UserStats } from "@/hooks/useAchievements";

type UseLevelCheckProps = {
  currentStats: UserStats; // ← Было: UserAchievementStats
  onLevelUp: (
    oldLevel: string,
    newLevel: string,
    type: "test" | "course",
  ) => void;
};
export function useLevelCheck({ currentStats, onLevelUp }: UseLevelCheckProps) {
  const checkLevelUp = useCallback(
    async (achievementType: "test" | "course") => {
      // Загружаем актуальные данные с сервера
      try {
        const response = await fetch("/api/profile/achievements", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const backendData = await response.json();

        const newStats: UserStats = {
          testsPassed75: backendData.tests_passed_75 ?? 0,
          coursesCompleted75: backendData.courses_completed_75 ?? 0,
          itemsPurchased: backendData.items_purchased ?? 0,
          hasCustomAvatar: backendData.has_custom_avatar ?? false,
        };

        // Рассчитываем старый и новый уровень
        const oldAchievements = getAchievements(currentStats);
        const newAchievements = getAchievements(newStats);

        const oldLevel = oldAchievements.main.currentLevel.title;
        const newLevel = newAchievements.main.currentLevel.title;

        // Если уровень изменился — показываем уведомление
        if (oldLevel !== newLevel) {
          onLevelUp(oldLevel, newLevel, achievementType);
        }

        return newStats;
      } catch (err) {
        console.error("❌ Failed to check level up:", err);
        return null;
      }
    },
    [currentStats, onLevelUp],
  );

  return { checkLevelUp };
}
