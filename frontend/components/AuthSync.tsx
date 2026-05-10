"use client";

import { useEffect } from "react";
import { useAuthListener } from "@/hooks/useAuthListener";
import useContactStore from "@/store/states";

export function AuthSync() {
  const { user, loading } = useAuthListener();
  const { setUser, isAuthenticated } = useContactStore();

  useEffect(() => {
    if (user) {
      setUser(user);
    } else if (!loading && isAuthenticated) {
      setUser(null);
    }
  }, [user, loading, setUser, isAuthenticated]);

  return null;
}
