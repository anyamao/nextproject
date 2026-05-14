// frontend/app/profile/[id]/page.tsx
"use client";

import AvatarWithOverlay from "@/components/AvatarWithOverlay";
import { useEffect, useState, useMemo } from "react"; // 🔥 Добавь useMemo
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  Check,
  Trophy,
  PawPrint,
  BookOpen,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getAchievements } from "@/hooks/useAchievements";
import AchievementCard from "@/components/AchievementCard";

type CompletedCourse = {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  completion_percent: number;
};

type PublicProfile = {
  id: number;
  username: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  about_me: string | null;
  created_at: string;
  token_balance: number;
  completed_courses: CompletedCourse[];
  equipped_item?: {
    id: number;
    name: string;
    image: string;
    price: number;
    description: string | null;
  } | null;
};

// 🔹 Тип для статистики достижений
type UserAchievementStats = {
  testsPassed75: number;
  coursesCompleted75: number;
  itemsPurchased: number;
  hasCustomAvatar: boolean;
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  // 🔥 Стейт для статистики достижений
  const [achievementStats, setAchievementStats] =
    useState<UserAchievementStats>({
      testsPassed75: 0,
      coursesCompleted75: 0,
      itemsPurchased: 0,
      hasCustomAvatar: false,
    });

  const achievements = useMemo(() => {
    if (!profile) return null;
    return getAchievements(achievementStats);
  }, [profile, achievementStats]); // Зависимости
  // Загрузка профиля
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiFetch(`/profile/public/${userId}`);
        setProfile(data);
      } catch (err) {
        console.error("❌ Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) fetchProfile();
  }, [userId]);

  // 🔥 Загрузка статистики достижений с бэкенда
  useEffect(() => {
    if (!profile?.id) return;

    apiFetch("/profile/achievements");

    apiFetch("/profile/achievements")
      .then((backendData: any) => {
        // 🔥 Параллельно загружаем статистику тестов
        return apiFetch("/profile/test-stats")
          .then((testStats: { tests_passed_75: number }) => {
            // Объединяем данные
            const stats: UserAchievementStats = {
              testsPassed75:
                testStats.tests_passed_75 ?? backendData.tests_passed_75 ?? 0,
              coursesCompleted75: backendData.courses_completed_75 ?? 0,
              itemsPurchased: backendData.items_purchased ?? 0,
              hasCustomAvatar: backendData.has_custom_avatar ?? false,
            };

            console.log("🔍 [Achievements] Merged stats:", stats);
            setAchievementStats(stats);
          })
          .catch(() => {
            // Если тест-статс не загрузился — берём из основного эндпоинта
            const stats: UserAchievementStats = {
              testsPassed75: backendData.tests_passed_75 ?? 0,
              coursesCompleted75: backendData.courses_completed_75 ?? 0,
              itemsPurchased: backendData.items_purchased ?? 0,
              hasCustomAvatar: backendData.has_custom_avatar ?? false,
            };
            setAchievementStats(stats);
          });
      })
      .catch((err) => {
        console.error("❌ Failed to load achievements:", err);
        // 🔥 Фоллбэк: считаем на фронтенде если эндпоинт не работает

        const fallbackStats: UserAchievementStats = {
          testsPassed75: 0, // 🔥 Загружай через отдельный эндпоинт /profile/test-stats
          coursesCompleted75:
            profile.completed_courses?.filter((c) => c.completion_percent >= 75)
              .length || 0,
          itemsPurchased: 0,
          hasCustomAvatar:
            !!profile.avatar_url && profile.avatar_url !== "default_cat.jpg",
        };

        setAchievementStats(fallbackStats);
      });
  }, [profile?.id]);
  // 🔹 После загрузки статистики:
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUserId(parsed.id);
      } catch {}
    }
  }, []);

  // 🔹 Флаг: это мой профиль?
  const isMyProfile = currentUserId === userId;
  // 🔹 Логирование расчёта достижений:
  useEffect(() => {
    if (achievements) {
      console.log("🔍 [Achievements] Calculated:", {
        main: achievements.main,
        isCatMode: achievements.main.isCatMode,
        coursesCompleted75: achievementStats.coursesCompleted75,
        testsPassed75: achievementStats.testsPassed75,
      });
    }
  }, [achievements, achievementStats]);
  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-600 text-lg mb-4">Пользователь не найден</p>
        <Link
          href="/courses"
          className="text-purple-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться к курсам
        </Link>
      </main>
    );
  }

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username;

  // 🔥 Если достижения ещё не рассчитаны — показываем лоадер
  if (!achievements) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      <div className="w-full mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Назад
        </button>
      </div>

      {/* 🔹 Карточка профиля */}
      <div className="bg-white rounded-lg shadow-xs p-8 w-full mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Аватар */}
          <AvatarWithOverlay
            baseAvatar={profile?.avatar_url || "default_cat.jpg"}
            overlayImage={profile?.equipped_item?.image}
            alt={profile?.username}
            size="xxxl"
          />

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-500 text-sm mt-1">@{profile.username}</p>

            {profile.status && (
              <p className="text-gray-800 text-sm mt-2 italic">
                {profile.status}
              </p>
            )}

            <p className="text-gray-400 text-xs mt-2">
              На платформе с{" "}
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                  })
                : "—"}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 rounded-full text-white text-sm font-semibold">
                <PawPrint className="w-4 h-4" />
                <span>{profile.token_balance} токенов</span>
              </div>
            </div>
          </div>
          {/* 🔹 Блок основного уровня */}
          <div className="mb-6 p-5 bg-purple-100 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-purple-950">
                  {achievements.main.currentLevel.title}
                </h3>

                {/* 🔥 Описание и галочка только для моего профиля */}
                {isMyProfile && (
                  <div className="w-full mt-[5px] bg-purple-200 rounded-lg p-[10px] flex flex-row items-center">
                    <p className="text-purple-800 text-xs font-semibold mt-1">
                      {achievements.main.currentLevel.description}
                    </p>
                    <Check className="w-4 h-4 text-purple-700 ml-[10px]" />
                  </div>
                )}

                {/* 🔥 Прогресс и подсказка только для моего профиля */}
                {isMyProfile && achievements.main.nextLevel && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-purple-900 font-semibold mb-1">
                      <span>До {achievements.main.nextLevel.title}</span>
                      <span>{100 - achievements.main.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${achievements.main.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-purple-700 mt-1">
                      {achievements.main.isCatMode
                        ? `Пройдите ещё ${achievements.main.nextLevel.threshold - achievementStats.coursesCompleted75} курс${achievements.main.nextLevel.threshold - achievementStats.coursesCompleted75 === 1 ? "" : achievements.main.nextLevel.threshold - achievementStats.coursesCompleted75 < 5 ? "а" : "ов"} на 75%`
                        : `Пройдите ещё ${achievements.main.nextLevel.threshold - achievementStats.testsPassed75} тест${achievements.main.nextLevel.threshold - achievementStats.testsPassed75 === 1 ? "" : achievements.main.nextLevel.threshold - achievementStats.testsPassed75 < 5 ? "а" : "ов"} на 75%`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 О себе */}
        {profile.about_me && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">О себе</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {profile.about_me}
            </p>
          </div>
        )}
      </div>

      {/* 🔹 Пройденные курсы */}
      <div className="w-full">
        <div className="w-full mb-[20px] shadow-xs bg-white rounded-lg p-[10px] px-[20px]">
          <h2 className="text-md font-semibold text-gray-800 flex items-center gap-2">
            Пройденные курсы ({profile.completed_courses.length})
          </h2>
        </div>

        {profile.completed_courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Пользователь ещё не прошёл ни одного курса
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.completed_courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/promo/${course.slug}`}
                className="group bg-white rounded-lg overflow-hidden hover:border-purple-300 transition"
              >
                {course.image ? (
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    <img
                      src={`/${course.image}`}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      onError={(e) => {
                        (
                          e.target as HTMLImageElement
                        ).parentElement?.classList.add("hidden");
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-purple-300" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 line-clamp-1">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${course.completion_percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-green-600">
                      {course.completion_percent}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 🔹 Секция достижений */}
      <div className="mt-[20px] w-full">
        <div className="w-full mb-[20px] shadow-xs bg-white rounded-lg p-[10px] px-[20px]">
          <h2 className="text-md font-semibold text-gray-800 flex items-center gap-2">
            Достижения
          </h2>
          {/* 🔹 Секция достижений — отдельные карточки */}
          <div className="w-full mt-[10px] grid grid-cols-2 mb-[20px] sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 🔹 Уничтожитель тестов */}
            <div className="bg-emerald-500 rounded-lg p-[10px] px-[20px] w-[300px]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {achievements.test_destroyer.currentLevel.title}
                    </h3>
                    {/* 🔥 Показывай описание только если это мой профиль */}
                    {isMyProfile && (
                      <p className="text-emerald-100 text-sm">
                        {achievements.test_destroyer.currentLevel.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* 🔹 Умный кот (курсы) */}
              {isMyProfile && achievements.test_destroyer.nextLevel && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-emerald-100 mb-1">
                    <span>
                      До {achievements.test_destroyer.nextLevel.title}
                    </span>
                    <span>{100 - achievements.test_destroyer.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{
                        width: `${achievements.test_destroyer.progress}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-emerald-100 mt-2">
                    Пройдите ещё 1 тест на 75%
                  </p>
                </div>
              )}
            </div>
            {/* 🔹 Умный кот (курсы) */}
            <div className="bg-violet-500 rounded-lg p-[10px] px-[20px] w-[300px]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {achievements.smart_cat.currentLevel.title}
                    </h3>
                    {isMyProfile && (
                      <p className="text-blue-100 text-sm">
                        {achievements.smart_cat.currentLevel.description}
                      </p>
                    )}
                  </div>
                </div>
                {isMyProfile &&
                  achievements.smart_cat.currentLevel.level > 1 && (
                    <div className="flex items-center gap-1 text-white/90 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Разблокировано</span>
                    </div>
                  )}
              </div>

              {isMyProfile && achievements.smart_cat.nextLevel && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-blue-100 mb-1">
                    <span>До {achievements.smart_cat.nextLevel.title}</span>
                    <span>{100 - achievements.smart_cat.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${achievements.smart_cat.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-100 mt-2">
                    Завершите ещё 1 курс на 75%
                  </p>
                </div>
              )}
            </div>

            {/* 🔹 Модный котик (покупки) */}
            <div className="bg-pink-500 rounded-lg p-[10px] px-[20px] w-[300px]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {achievements.fashion_cat.currentLevel.title}
                    </h3>
                    {isMyProfile && (
                      <p className="text-pink-100 text-sm">
                        {achievements.fashion_cat.currentLevel.description}
                      </p>
                    )}
                  </div>
                </div>
                {isMyProfile &&
                  achievements.fashion_cat.currentLevel.level > 1 && (
                    <div className="flex items-center gap-1 text-white/90 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Разблокировано</span>
                    </div>
                  )}
              </div>

              {isMyProfile && achievements.fashion_cat.nextLevel && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-pink-100 mb-1">
                    <span>До {achievements.fashion_cat.nextLevel.title}</span>
                    <span>{100 - achievements.fashion_cat.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${achievements.fashion_cat.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-pink-100 mt-2">
                    Купите ещё 1 товар в магазине
                  </p>
                </div>
              )}
            </div>
            {/* 🔹 Модный котик (покупки) */}
          </div>
        </div>
      </div>
    </main>
  );
}
