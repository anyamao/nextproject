// frontend/app/profile/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coins, Trophy, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";

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
  status: string | null; // 🔥 Добавь
  about_me: string | null; // 🔥 Добавь
  created_at: string; //
  token_balance: number;
  completed_courses: CompletedCourse[];
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
  useEffect(() => {
    console.log("🔍 [PublicProfile] Profile data:", {
      status: profile?.status,
      about_me: profile?.about_me,
      created_at: profile?.created_at,
      created_at_type: typeof profile?.created_at,
    });
  }, [profile]);
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
      {/* 🔹 Карточка профиля */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Аватар */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={`/avatars/${profile.avatar_url}`}
                alt={fullName}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span>{fullName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          {/* Информация */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-500 text-sm mt-1">@{profile.username}</p>

            {/* Статус */}
            {profile.status && (
              <p className="text-purple-600 text-sm mt-2 italic">
                {profile.status}
              </p>
            )}

            {/* Дата регистрации — с защитой от Invalid Date */}
            <p className="text-gray-400 text-xs mt-2">
              На платформе с{" "}
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                  })
                : "—"}
            </p>
            {/* Баланс токенов */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full text-white text-sm font-semibold">
                <Coins className="w-4 h-4" />
                <span>{profile.token_balance} токенов</span>
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
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Пройденные курсы ({profile.completed_courses.length})
        </h2>

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
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-purple-300 transition"
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
    </main>
  );
}
