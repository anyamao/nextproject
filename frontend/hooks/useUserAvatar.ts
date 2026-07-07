// hooks/useUserAvatar.ts

"use client";

import { useEffect } from "react";
import useContactStore from "@/store/states";
import { apiFetch } from "@/lib/api";

export function useUserAvatar() {
  const { user, updateUserAvatar } = useContactStore();

  useEffect(() => {
    // 🔥 Проверяем, нужно ли обновить аватар
    if (user?.id) {
      const updateAvatar = async () => {
        try {
          const data = await apiFetch("/profile/avatar");
          if (data?.avatar_url && data.avatar_url !== user.avatar_url) {
            updateUserAvatar(data.avatar_url);
          }
        } catch (error) {
          // Если ошибка - просто игнорируем
          console.debug("Avatar update skipped");
        }
      };

      updateAvatar();
    }
  }, [user?.id, user?.avatar_url, updateUserAvatar]);
}
