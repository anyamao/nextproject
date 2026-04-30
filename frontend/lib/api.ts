// frontend/lib/api.ts

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    if (
      window.location.hostname === "maoschool.ru" ||
      window.location.hostname === "www.maoschool.ru"
    ) {
      return "";
    }
    return "http://localhost:8010";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8010";
};

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const BASE_URL = getBaseUrl(); // ✅ Используем динамический baseURL
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    cache: options.cache || "no-store",
  });

  // 🔥 УБРАЛИ автоматический редирект на 401!
  // Теперь компонент сам решает, что делать с ошибкой авторизации

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `HTTP ${response.status}`;

    // 🔍 Логируем для отладки
    console.warn(
      `⚠️ [apiFetch] ${response.status} for ${endpoint}:`,
      errorMessage,
    );

    // 🔥 Выбрасываем ошибку с кодом статуса, чтобы компонент мог проверить
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  // Пустой ответ (204 No Content)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
