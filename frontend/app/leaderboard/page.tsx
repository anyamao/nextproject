"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  Trophy,
  BookOpen,
  ShoppingBag,
  Target,
  Medal,
  Search,
} from "lucide-react";
import AvatarWithOverlay from "@/components/AvatarWithOverlay";

type LeaderboardUser = {
  user_id: number;
  username: string;
  avatar_url: string | null;
  score: number;
  equipped_item?: {
    id: number;
    name: string;
    image: string;
    price: number;
    description: string | null;
  } | null;
};
type MyRankInfo = {
  rank: number | null;
  score: number;
};

type LeaderboardData = {
  top_courses: LeaderboardUser[];
  top_items: LeaderboardUser[];
  top_tests: LeaderboardUser[];
};
type TabType = "courses" | "items" | "tests";

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("courses");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const result = await apiFetch("/leaderboard?limit=10");
        setData(result);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUserId(parsed.id);
      } catch {}
    }
  }, []);
  const getTabData = () => {
    if (!data) return [];
    switch (activeTab) {
      case "courses":
        return data.top_courses;
      case "items":
        return data.top_items;
      case "tests":
        return data.top_tests;
      default:
        return [];
    }
  };

  const getTabConfig = () => {
    switch (activeTab) {
      case "courses":
        return {
          icon: BookOpen,
          title: "Пройденные курсы",
          color: "bg-purple-500",
          textColor: "text-purple-700",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          unit: "курсов",
        };
      case "items":
        return {
          icon: ShoppingBag,
          title: "Купленные предметы",
          color: "bg-pink-500",
          textColor: "text-pink-700",
          bgColor: "bg-pink-50",
          borderColor: "border-pink-200",
          unit: "предметов",
        };
      case "tests":
        return {
          icon: Target,
          title: "Пройденные тесты",
          color: "bg-emerald-500",
          textColor: "text-emerald-700",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          unit: "тестов",
        };
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        // 🔥 Добавляем параметр search в запрос
        const params = new URLSearchParams();
        params.append("limit", "10");
        if (debouncedSearch.trim()) {
          params.append("search", debouncedSearch.trim());
        }

        const result = await apiFetch(`/leaderboard?${params.toString()}`);
        setData(result);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [debouncedSearch]); // ← 🔥 Перезагружаем при изменении поиска
  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return index + 1;
  };

  const tabConfig = getTabConfig();
  const TabIcon = tabConfig.icon;
  const leaderboardData = getTabData();

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      <div className="w-full mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          Топ пользователей
        </h1>
        <p className="text-gray-600 mt-2">Самые активные участники платформы</p>
      </div>
      <div className="w-full mb-6">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Поиск пользователя по имени..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {debouncedSearch && (
          <p className="text-center text-sm text-gray-500 mt-2">
            Поиск: "{debouncedSearch}" — {leaderboardData.length} результатов
          </p>
        )}
      </div>
      <div className="w-full mb-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === "courses"
              ? "bg-purple-500 text-white shadow-xs"
              : "bg-white text-gray-700 hover:bg-purple-50 "
          }`}
        >
          По курсам
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === "items"
              ? "bg-pink-500 text-white shadow-xs"
              : "bg-white text-gray-700 hover:bg-pink-50 "
          }`}
        >
          По покупкам
        </button>
        <button
          onClick={() => setActiveTab("tests")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === "tests"
              ? "bg-emerald-500 text-white shadow-xs"
              : "bg-white text-gray-700 hover:bg-emerald-50 "
          }`}
        >
          По тестам
        </button>
      </div>
      <div className={`w-full `}>
        <h2
          className={`text-xl font-bold ${tabConfig.textColor} mb-4 flex items-center gap-2`}
        >
          {tabConfig.title}
        </h2>

        <div className="space-y-3">
          {leaderboardData.map((user, index) => (
            <Link
              key={user.user_id}
              href={`/profile/${user.user_id}`}
              className="flex items-center gap-4 bg-white p-4 rounded-lg transition group"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl font-bold">
                {getRankIcon(index)}
              </div>

              <div className="flex-shrink-0">
                <AvatarWithOverlay
                  baseAvatar={user.avatar_url || "default_cat.jpg"}
                  overlayImage={user.equipped_item?.image || null}
                  alt={user.username}
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-purple-600 truncate">
                  {user.username}
                </p>
              </div>

              <div
                className={`flex-shrink-0 px-4 py-2 ${tabConfig.color} text-sm text-white rounded-lg font-bold shadow-none`}
              >
                {user.score}{" "}
                {user.score === 1 ? getUnitSingular(activeTab) : tabConfig.unit}
              </div>
            </Link>
          ))}
        </div>

        {leaderboardData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Medal className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Пока нет данных</p>
          </div>
        )}
      </div>
    </main>
  );
}

function getUnitSingular(tab: TabType): string {
  switch (tab) {
    case "courses":
      return "курс";
    case "items":
      return "предмет";
    case "tests":
      return "тест";
  }
}
