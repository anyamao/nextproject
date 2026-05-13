// frontend/hooks/useTokens.ts
"use client";

import { useCallback, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import useContactStore from "@/store/states";
// frontend/hooks/useTokens.ts — упрощаем

export function useTokens() {
  const { tokenBalance, setTokenBalance } = useContactStore();

  // Загрузка баланса с сервера
  const fetchBalance = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setTokenBalance(0);
        return;
      }
      const data = await apiFetch("/profile/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTokenBalance(data.token_balance ?? 0);
    } catch (err) {
      console.error("❌ Failed to fetch balance:", err);
    }
  }, [setTokenBalance]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance: tokenBalance,
    loading: false,
    fetchBalance,
    // 🔥 Убираем rewardTokens — награды теперь только на бэкенде!
  };
}
