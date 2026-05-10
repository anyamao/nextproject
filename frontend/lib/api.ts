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
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8010";

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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.detail || `HTTP ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}
