// frontend/lib/auth.ts

// Тип для payload JWT
export type JWTPayload = {
  sub?: string;
  username?: string;
  exp?: number;
  [key: string]: unknown;
};

// Тип для пользователя приложения
export type AppUser = {
  id: number;
  email: string;
  username: string;
  avatar_url?: string; // ✅ Добавь это поле (опциональное)
  status?: string;
};

// Простая функция для декодирования JWT (без проверки подписи)
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

// Проверка, истёк ли токен
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload?.exp) return true;

  // exp в секундах, Date.now() в миллисекундах
  return payload.exp * 1000 < Date.now();
}

// Получить пользователя из токена
export function getUserFromToken(token: string): AppUser | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.sub) return null;
  return {
    id: 0, // ⚠️ JWT обычно не содержит id, лучше получать из /profile
    email: payload.sub,
    username: payload.username || "",
    avatar_url: undefined, // ⚠️ JWT не содержит avatar_url
    status: undefined,
  };
}

// Вспомогательные функции для localStorage
export const authStorage = {
  getToken: () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null,
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  },
  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  },

  getUsername: () =>
    typeof window !== "undefined" ? localStorage.getItem("username") : null,
  setUsername: (username: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("username", username);
    }
  },
  removeUsername: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("username");
    }
  },

  // Полная очистка при логауте
  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
    }
  },
};
