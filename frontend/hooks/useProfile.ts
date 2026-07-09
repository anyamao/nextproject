// hooks/useProfile.ts

import { useState, useEffect, useCallback, useMemo } from "react";
import { profileApi } from "@/lib/api/profile";
import { getAchievements } from "@/hooks/useAchievements";
import type {
  PublicProfile,
  UserAchievementStats,
  Achievements,
} from "@/types/profile";

interface UseProfileReturn {
  profile: PublicProfile | null;
  achievements: Achievements | null;
  loading: boolean;
  error: string | null;
  isMyProfile: boolean;
  refetch: () => Promise<void>;
}

export function useProfile(
  userId: number,
  currentUserId: number | null,
): UseProfileReturn {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [achievementStats, setAchievementStats] =
    useState<UserAchievementStats>({
      testsPassed75: 0,
      coursesCompleted75: 0,
      itemsPurchased: 0,
      hasCustomAvatar: false,
    });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMyProfile = currentUserId === userId;

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔥 Загружаем профиль
      const profileData = await profileApi.getPublicProfile(userId);
      setProfile(profileData);

      // 🔥 Загружаем достижения
      const stats = await profileApi.getAchievements(userId, isMyProfile);

      // 🔥 Если свой профиль - загружаем тест-статистику
      if (isMyProfile) {
        try {
          const testStats = await profileApi.getTestStats();
          setAchievementStats({
            ...stats,
            testsPassed75: testStats.tests_passed_75 ?? stats.testsPassed75,
          });
        } catch {
          setAchievementStats(stats);
        }
      } else {
        setAchievementStats(stats);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load profile";
      setError(message);
      console.error("❌ Profile error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, isMyProfile]);

  // 🔥 Расчет достижений
  const achievements = useMemo(() => {
    if (!profile) return null;
    return getAchievements(achievementStats);
  }, [profile, achievementStats]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  return {
    profile,
    achievements,
    loading,
    error,
    isMyProfile,
    refetch: fetchProfile,
  };
}
