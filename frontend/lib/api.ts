// frontend/lib/api.ts
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 🔁 Для сервера используем относительный путь или переменную без NEXT_PUBLIC_
const SERVER_API_URL =
  process.env.API_URL || "http://127.0.0.1:8010"; // ✅ Порт 8010!

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // 🔁 Определяем, где выполняется код: на сервере или в браузере
  const isServer = typeof window === "undefined";
  const baseUrl = isServer ? SERVER_API_URL : API_URL;
  
  // 🔁 Для сервера используем относительный путь, если запрос к /api/
  // nginx сам проксирует /api/ → 127.0.0.1:8010
  const url = isServer && endpoint.startsWith("/api/")
    ? `http://127.0.0.1:8010${endpoint}`  // ✅ Прямой запрос к бэкенду на сервере
    : `${baseUrl}${endpoint}`;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  // Токен добавляем только в браузере
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: options.cache || "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}
