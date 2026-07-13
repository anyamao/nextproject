// lib/sanitize.ts

/**
 * Санитизация текста - удаление опасных HTML/JS символов
 * Используется для защиты от XSS
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";

  // Преобразуем в строку
  let text = String(input);

  // Удаляем HTML теги
  text = text.replace(/<[^>]*>/g, "");

  // Удаляем потенциально опасные символы
  text = text.replace(/[&<>"]/g, function (match) {
    const escapeMap: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    };
    return escapeMap[match] || match;
  });

  // Удаляем скриптовые конструкции
  text = text.replace(/javascript:/gi, "");
  text = text.replace(/on\w+=/gi, "");

  // Ограничиваем длину (если нужно)
  // text = text.slice(0, 2000);

  return text;
}

/**
 * Санитизация username - только безопасные символы
 */
export function sanitizeUsername(input: string | null | undefined): string {
  if (!input) return "";

  let text = String(input);

  // Разрешаем только буквы, цифры, _, . и -
  text = text.replace(/[^a-zA-Z0-9_.-]/g, "");

  // Удаляем дублирующиеся точки и дефисы
  text = text.replace(/\.{2,}/g, ".");
  text = text.replace(/-{2,}/g, "-");

  // Ограничиваем длину
  text = text.slice(0, 30);

  return text;
}

/**
 * Санитизация email
 */
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input) return "";

  let text = String(input).trim().toLowerCase();

  // Удаляем опасные символы
  text = text.replace(/[<>"']/g, "");

  // Ограничиваем длину
  text = text.slice(0, 255);

  return text;
}

/**
 * Санитизация textarea (сохраняет переносы строк, но удаляет HTML)
 */
export function sanitizeTextarea(input: string | null | undefined): string {
  if (!input) return "";

  let text = String(input);

  // Удаляем HTML теги
  text = text.replace(/<[^>]*>/g, "");

  // Экранируем опасные символы
  text = text.replace(/[&<>"]/g, function (match) {
    const escapeMap: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    };
    return escapeMap[match] || match;
  });

  // Удаляем скриптовые конструкции
  text = text.replace(/javascript:/gi, "");
  text = text.replace(/on\w+=/gi, "");

  // Ограничиваем длину
  text = text.slice(0, 2000);

  return text;
}

/**
 * Проверка на опасные паттерны
 */
export function hasDangerousPatterns(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /onmouseover=/i,
    /onfocus=/i,
    /onblur=/i,
    /expression\(/i,
    /eval\(/i,
    /alert\(/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(input));
}
