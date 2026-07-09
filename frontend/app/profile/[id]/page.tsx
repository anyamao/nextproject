// frontend/app/profile/[id]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, PawPrint, BookOpen, X } from "lucide-react";

// 🔥 Компоненты
import AvatarWithOverlay from "@/components/AvatarWithOverlay";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { AchievementCard } from "@/components/profile/AchievementCard";

// 🔥 Хуки и API
import { useProfile } from "@/hooks/useProfile";
import { profileApi } from "@/lib/api/profile";

// 🔥 Типы
import type { CompletedCourse } from "@/types/profile";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [courses, setCourses] = useState<CompletedCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesTotal, setCoursesTotal] = useState(0);
  const [coursesTotalPages, setCoursesTotalPages] = useState(1);

  // 🔥 Получаем текущего пользователя из localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUserId(parsed.id);
      } catch {
        // ignore
      }
    }
  }, []);

  // 🔥 Используем кастомный хук для профиля
  const { profile, achievements, loading, error, isMyProfile, refetch } =
    useProfile(userId, currentUserId);

  // 🔥 Загрузка курсов с пагинацией
  useEffect(() => {
    if (!profile?.id) return;

    const loadCourses = async () => {
      try {
        setCoursesLoading(true);
        const data = await profileApi.getUserCourses(
          profile.id,
          coursesPage,
          10,
        );
        setCourses(data.courses);
        setCoursesTotal(data.total);
        setCoursesTotalPages(data.totalPages);
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, [profile?.id, coursesPage]);

  // 🔥 Обработка ошибок
  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={() => refetch()}
          className="text-purple-600 hover:underline flex items-center gap-2"
        >
          Попробовать снова
        </button>
        <Link
          href="/courses"
          className="text-purple-600 hover:underline flex items-center gap-2 mt-4"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться к курсам
        </Link>
      </main>
    );
  }

  // 🔥 Загрузка
  if (loading || !profile || !achievements) {
    return <ProfileSkeleton />;
  }

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username;

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      {/* 🔥 Назад */}
      <div className="w-full mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
          aria-label="Назад"
        >
          <ArrowLeft className="w-5 h-5" /> Назад
        </button>
      </div>

      {/* 🔥 Баннер системы рангов */}
      <div className="bg-pink-300 rounded-lg mb-[20px] justify-between items-center text-pink-900 w-full flex flex-row p-[10px] px-[20px] text-xs">
        <p className="text-xs">
          Система кошачих рангов и левелов, хочешь узнать подробнее?
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-500 text-pink-100 hover:bg-pink-600 duration-300 cursor-pointer font-semibold rounded-lg p-[10px] px-[20px]"
        >
          узнать подробнее
        </button>
      </div>

      {/* 🔥 Модалка */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="relative w-[500px] max-w-[90vw] h-[560px] max-h-[85vh] flex flex-col p-[20px] rounded-lg shadow-xs border-[8px] border-pink-300 bg-pink-100 pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 cursor-pointer hover:bg-pink-200 rounded-lg right-3 text-pink-400 hover:text-pink-600 transition-colors duration-200"
                aria-label="Закрыть"
              >
                <X className="w-6 h-6" />
              </button>

              <p className="font-semibold text-md text-pink-900 mb-[10px] pr-6">
                Эволюция котенка в кота
              </p>

              <div className="bg-pink-200 p-[20px] px-[20px] text-sm rounded-lg">
                <p className="border-b-[2px] border-b-pink-300 text-pink-900 pb-[5px]">
                  До прохождения первого курса на 75% ты котенок начиная с 0
                  уровня и далее с каждым пройденным на 75% тестом твой уровень
                  повышается на один.
                </p>
                <p className="pt-[5px] text-pink-900">
                  При прохождении первого курса на 75% ты становишься котом
                  первого уровня и далее твой уровень повышается с прохождением
                  каждого нового курса на 75%
                </p>
              </div>

              <p className="font-semibold text-md text-pink-900 mt-[20px] mb-[10px]">
                Достижения по секциям
              </p>

              <p className="text-xs text-gray-700 mb-[10px]">
                По каждому из этих достижений формируется топ во вкладке
                Топ-котики, может ты уже там есть!
              </p>

              <div className="bg-pink-200 p-[20px] px-[20px] text-sm rounded-lg flex-1 overflow-y-auto">
                <p className="border-b-[2px] border-b-pink-300 text-pink-900 pb-[5px]">
                  Уничтожитель тестов: при каждом уникальном прохождении теста
                  на 75% твой уровень повышается на 1
                </p>
                <p className="pt-[5px] border-b-[2px] pb-[5px] border-b-pink-300 text-pink-900">
                  Умный кот: при каждом уникальном прохождении курса на 75% твой
                  уровень повышается на 1
                </p>
                <p className="pt-[5px] text-pink-900">
                  Модный котик: при каждой покупке в магазине твой уровень
                  повышается на 1
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🔥 КАРТОЧКА ПРОФИЛЯ */}
      <div className="bg-white rounded-lg shadow-xs p-8 w-full mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Аватар */}
          <AvatarWithOverlay
            baseAvatar={profile.avatar_url || "default_cat.jpg"}
            overlayImage={profile.equipped_item?.image}
            alt={profile.username}
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
        </div>

        {/* 🔥 УРОВЕНЬ */}
        <div className="mb-6 p-5 bg-purple-100 rounded-lg mt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-purple-950">
                {achievements.main.currentLevel.title}
              </h3>

              {isMyProfile && (
                <div className="w-full mt-[5px] bg-purple-200 rounded-lg p-[10px] flex flex-row items-center">
                  <p className="text-purple-800 text-xs font-semibold mt-1">
                    {achievements.main.currentLevel.description}
                  </p>
                </div>
              )}

              {isMyProfile && achievements.main.nextLevel && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-purple-900 font-semibold mb-1">
                    <span>До {achievements.main.nextLevel.title}</span>
                  </div>
                  <p className="text-xs text-purple-700 mt-1"></p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔥 О СЕБЕ */}
        {profile.about_me && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">О себе</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {profile.about_me}
            </p>
          </div>
        )}
      </div>

      {/* 🔥 ПРОЙДЕННЫЕ КУРСЫ */}
      <div className="w-full">
        <div className="w-full mb-[20px] shadow-xs bg-white rounded-lg p-[10px] px-[20px]">
          <h2 className="text-md font-semibold text-gray-800 flex items-center gap-2">
            Пройденные курсы ({coursesTotal})
          </h2>
        </div>

        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Пользователь ещё не прошёл ни одного курса
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courses.map((course) => (
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

            {/* 🔥 Пагинация */}
            {coursesTotalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: coursesTotalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCoursesPage(page)}
                      className={`px-4 py-2 rounded-lg transition ${
                        page === coursesPage
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 🔥 ДОСТИЖЕНИЯ */}
      <div className="mt-[20px] w-full">
        <div className="w-full mb-[20px] shadow-xs bg-white rounded-lg p-[10px] px-[20px]">
          <h2 className="text-md font-semibold text-gray-800 flex items-center gap-2">
            Достижения
          </h2>

          <div className="w-full mt-[10px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AchievementCard
              category={achievements.test_destroyer}
              title="Уничтожитель тестов"
              color="emerald"
              nextText="Пройти ещё 1 тест на 75%"
            />

            <AchievementCard
              category={achievements.smart_cat}
              title="Умный кот"
              color="violet"
              nextText="Завершить ещё 1 курс на 75%"
            />

            <AchievementCard
              category={achievements.fashion_cat}
              title="Модный котик"
              color="pink"
              nextText="Купить ещё 1 товар в магазине"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
