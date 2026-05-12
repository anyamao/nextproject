// frontend/hooks/useTokens.ts
"use client";

import { useCallback, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import useContactStore from "@/store/states";

export function useTokens() {
  // 🔥 Берём баланс и методы из глобального стора
  const { tokenBalance, setTokenBalance, addTokens } = useContactStore();

  // Загрузка баланса с сервера
  const fetchBalance = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const data = await apiFetch("/profile/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // 🔥 Обновляем глобальный стейт
      setTokenBalance(data.token_balance || 0);
    } catch (err) {
      console.error("❌ Failed to fetch balance:", err);
    }
  }, [setTokenBalance]);

  // Начисление токенов
  const rewardTokens = useCallback(
    async (amount: number, reason: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        await apiFetch("/profile/balance/reward", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount, reason }),
        });

        // 🔥 Обновляем глобальный стейт мгновенно
        addTokens(amount);

        // Перезагружаем с сервера для точности (опционально)
        await fetchBalance();
      } catch (err) {
        console.error("❌ Failed to reward tokens:", err);
      }
    },
    [addTokens, fetchBalance],
  );

  // Загружаем баланс при маунте
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance: tokenBalance, // 🔥 Теперь это глобальное значение
    loading: false, // 🔥 Убираем лоадер (загружается из localStorage)
    fetchBalance,
    rewardTokens,
  };
}
