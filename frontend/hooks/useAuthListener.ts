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

declare global {
  interface Window {
    refreshAuth?: () => void;
  }
}

export function useAuthListener() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = authStorage.getToken();

      if (!token || isTokenExpired(token)) {
        authStorage.clear();
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = getUserFromToken(token);
      if (userData) {
        setUser(userData);
      } else {
        authStorage.clear();
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        checkAuth();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(checkAuth, 30000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const refreshAuth = () => {
    const token = authStorage.getToken();
    if (token && !isTokenExpired(token)) {
      const userData = getUserFromToken(token);
      if (userData) setUser(userData);
    }
  };

  useEffect(() => {
    window.refreshAuth = refreshAuth;
    return () => {
      delete window.refreshAuth;
    };
  }, [refreshAuth]);

  return { user, loading };
}
