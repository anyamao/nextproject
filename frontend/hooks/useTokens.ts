// frontend/hooks/useTokens.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import useContactStore from "@/store/states";
// frontend/hooks/useTokens.ts

export function useTokens() {
  const { tokenBalance, setTokenBalance } = useContactStore();
  const [loading, setLoading] = useState(true);

  // 🔥 Загружаем баланс с сервера при маунте и при изменении токена
  useEffect(() => {
    async function fetchBalance() {
      const token = localStorage.getItem("token");
      if (!token) {
        setTokenBalance(0); // ← Сбрасываем если нет токена
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch("/profile/balance", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTokenBalance(data.token_balance ?? 0);
      } catch (err) {
        console.error("❌ Failed to fetch balance:", err);
        setTokenBalance(0); // ← Сбрасываем при ошибке
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, []); // ← Запускаем при маунте

  return { balance: tokenBalance, loading };
}
