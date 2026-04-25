// frontend/components/AuthSync.tsx
"use client";

import { useEffect } from "react";
import { useAuthListener } from "@/hooks/useAuthListener";
import useContactStore from "@/store/states";

export function AuthSync() {
  const { user, loading } = useAuthListener();
  const { setUser, isAuthenticated } = useContactStore();

  useEffect(() => {
    // Синхронизируем Zustand store с хуком
    if (user) {
      setUser(user);
    } else if (!loading && isAuthenticated) {
      // Если хук говорит "нет пользователя", но store думает, что авторизован — исправляем
      setUser(null);
    }
  }, [user, loading, setUser, isAuthenticated]);

  return null; // Этот компонент ничего не рендерит
}
