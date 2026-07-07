// lib/api.ts - ОБНОВЛЕННАЯ ВЕРСИЯ (без Sentry)

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    if (
      window.location.hostname === "maoschool.ru" ||
      window.location.hostname === "www.maoschool.ru"
    ) {
      return "";
    }
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8010";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8010";
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  const normalizedEndpoint = endpoint.startsWith("/api/")
    ? endpoint
    : `/api/v1${endpoint}`;

  const url = `${baseUrl}${normalizedEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      cache: options.cache || "no-store",
    });

    // Обработка 401 (кроме auth эндпоинтов)
    if (response.status === 401 && !normalizedEndpoint.includes("/auth/")) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return apiFetch(endpoint, options);
      }
      throw new ApiError("Session expired", 401);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || `HTTP ${response.status}`;
      // 🔥 УБИРАЕМ отправку в Sentry
      throw new ApiError(message, response.status, errorData.error_code);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // 🔥 УБИРАЕМ отправку в Sentry
    throw new ApiError("Network error", 500);
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

async function refreshToken(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push(() => resolve(true));
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      refreshSubscribers.forEach((cb) => cb(data.access_token));
      refreshSubscribers = [];
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}
