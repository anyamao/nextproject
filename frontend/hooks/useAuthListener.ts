// hooks/useAuthListener.ts

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useContactStore from "@/store/states";
import { apiFetch } from "@/lib/api";

export function useAuthListener() {
  const router = useRouter();
  const { setUser, clearUser } = useContactStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 🔥 Проверяем авторизацию через бэкенд (проверяет HttpOnly cookie)
        const data = await apiFetch("/auth/me");

        if (data?.user) {
          setUser({
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            avatar_url: data.user.avatar_url || "default_cat.jpg",
            status: data.user.status,
          });
        } else {
          clearUser();
        }
      } catch (error) {
        // Если 401 - пользователь не авторизован
        clearUser();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // 🔥 Проверка каждые 5 минут
    const interval = setInterval(checkAuth, 5 * 60 * 1000);

    // 🔥 Слушаем события смены пользователя
    const handleStorageChange = () => {
      checkAuth();
    };
    window.addEventListener("focus", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, [setUser, clearUser]);

  return { loading };
}
