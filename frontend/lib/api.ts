// 🔁 Определяем базовый URL: относительный для prod, localhost для dev
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // В браузере: если на домене — используем относительный путь
    if (
      window.location.hostname === "maoschool.ru" ||
      window.location.hostname === "www.maoschool.ru"
    ) {
      return ""; // Относительный: /api/... → nginx проксирует
    }
    // Для localhost — явный порт бэкенда
    return "http://localhost:8010";
  }
  // На сервере (SSR): используем env или дефолт
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8010";
};

// lib/api.ts
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

  // Получаем токен из localStorage (только на клиенте)
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // Обработка 401 — токен истёк
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/"; // или редирект на логин
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }

  return response.json();
}
