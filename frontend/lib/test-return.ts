// frontend/lib/test-return.ts

/**
 * Сохраняет URL возврата перед переходом на тест
 */
export function saveTestReturnUrl(testId: number, returnUrl: string): void {
  if (typeof window === "undefined") return;

  // Сохраняем в sessionStorage для надёжности
  sessionStorage.setItem(`test_${testId}_returnTo`, returnUrl);
}

/**
 * Получает URL возврата после прохождения теста
 * Приоритет: 1) URL-параметр returnTo → 2) sessionStorage → 3) дефолт
 */
export function getTestReturnUrl(
  testId: number,
  defaultReturn: string = "/courses",
): string {
  if (typeof window === "undefined") return defaultReturn;

  // 1️⃣ Пробуем взять из текущих URL-параметров (самый надёжный способ)
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("returnTo");
  if (fromUrl) {
    console.log(`🔍 [test-return] returnTo from URL: ${fromUrl}`);
    return fromUrl;
  }

  // 2️⃣ Пробуем взять из sessionStorage (запасной вариант)
  const saved = sessionStorage.getItem(`test_${testId}_returnTo`);
  if (saved) {
    console.log(`🔍 [test-return] returnTo from sessionStorage: ${saved}`);
    return saved;
  }

  // 3️⃣ Дефолт
  console.log(`🔍 [test-return] Using default returnTo: ${defaultReturn}`);
  return defaultReturn;
}

/**
 * Очищает сохранённый returnTo после использования
 */
export function clearTestReturnUrl(testId: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`test_${testId}_returnTo`);
}
