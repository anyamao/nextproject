// hooks/useAuth.ts

"use client";

import { useEffect } from "react";
import useContactStore from "@/store/states";

export function useAuth() {
  const { user, isAuthenticated, isLoading, checkAuth, clearUser } =
    useContactStore();

  useEffect(() => {
    // Проверяем авторизацию при загрузке
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
    clearUser,
  };
}
