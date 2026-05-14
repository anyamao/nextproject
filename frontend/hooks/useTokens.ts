// frontend/hooks/useTokens.ts
import useContactStore from "@/store/states";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useTokens() {
  const { tokenBalance, setTokenBalance } = useContactStore();

  // 🔥 Авто-обновление при маунте + при фокусе окна
  useEffect(() => {
    const fetchBalance = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const data = await apiFetch("/profile/balance", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        setTokenBalance(data.token_balance ?? 0);
      } catch {}
    };

    fetchBalance();

    // 🔥 Обновлять при возврате на вкладку (если награда пришла в фоне)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchBalance();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [setTokenBalance]);

  return {
    balance: tokenBalance,
    loading: false,
    refresh: () => {
      // 🔥 Ручное обновление по запросу
      const token = localStorage.getItem("token");
      if (token) {
        apiFetch("/profile/balance", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }).then((data) => setTokenBalance(data.token_balance ?? 0));
      }
    },
  };
}
