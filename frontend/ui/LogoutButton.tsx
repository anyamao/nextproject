// frontend/components/LogoutButton.tsx

"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 🔥 Запрос на бэкенд
      const base_url =
        typeof window !== "undefined"
          ? window.location.hostname === "maoschool.ru"
            ? ""
            : "http://localhost:8010"
          : "http://localhost:8010";

      await fetch(`${base_url}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    // 🔥 Очищаем ВСЁ локальное состояние
    if (typeof window !== "undefined") {
      // Очищаем localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("maoschool-storage");

      // Очищаем sessionStorage
      sessionStorage.clear();

      // Очищаем cookies (удаляем вручную)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(
            /=.*/,
            "=; expires=" + new Date().toUTCString() + "; path=/",
          );
      });
    }

    // 🔥 Принудительно перезагружаем страницу
    window.location.href = "/";
  };

  return (
    <button onClick={handleLogout} className="flex items-center w-full">
      <LogOut className="w-[17px] h-[17px] text-red-600" />
      <span className="ml-[10px] smaller-text">Выйти</span>
    </button>
  );
}
