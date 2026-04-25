// frontend/hooks/useAuthListener.ts
"use client";

import { useEffect, useState } from "react";
import {
  decodeJWT,
  isTokenExpired,
  getUserFromToken,
  authStorage,
  AppUser,
} from "@/lib/auth";

// Расширяем тип Window для нашей функции
declare global {
  interface Window {
    refreshAuth?: () => void;
  }
}

export function useAuthListener() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Функция проверки авторизации
    const checkAuth = () => {
      const token = authStorage.getToken();

      if (!token || isTokenExpired(token)) {
        // Токена нет или он истёк — пользователь не авторизован
        authStorage.clear();
        setUser(null);
        setLoading(false);
        return;
      }

      // Токен валиден — декодируем пользователя
      const userData = getUserFromToken(token);
      if (userData) {
        setUser(userData);
      } else {
        authStorage.clear();
        setUser(null);
      }
      setLoading(false);
    };

    // Проверяем при монтировании
    checkAuth();

    // 🔔 Слушаем события storage для синхронизации между вкладками
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        checkAuth();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 🔔 Опционально: периодическая проверка истечения токена (каждые 30 сек)
    const interval = setInterval(checkAuth, 30000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Функция для принудительного обновления (после логина/регистрации)
  const refreshAuth = () => {
    const token = authStorage.getToken();
    if (token && !isTokenExpired(token)) {
      const userData = getUserFromToken(token);
      if (userData) setUser(userData);
    }
  };

  // Делаем refreshAuth доступным глобально
  useEffect(() => {
    window.refreshAuth = refreshAuth;
    return () => {
      delete window.refreshAuth;
    };
  }, [refreshAuth]);

  return { user, loading };
}
