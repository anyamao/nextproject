// frontend/components/CopyLinkButton.tsx
"use client";

import { useState } from "react";
import { Link, Check, Copy } from "lucide-react";

interface CopyLinkButtonProps {
  url?: string; // ✅ Опционально: кастомная ссылка
  label?: string; // ✅ Опционально: текст кнопки
  variant?: "icon" | "button"; // ✅ Стиль: только иконка или кнопка
  className?: string; // ✅ Доп. классы
}

export default function CopyLinkButton({
  url,
  label = "Копировать ссылку",
  variant = "icon",
  className = "",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // ✅ Если url не передан — берём текущую страницу
      const linkToCopy = url || window.location.href;

      await navigator.clipboard.writeText(linkToCopy);

      setCopied(true);

      // ✅ Сбрасываем состояние через 2 секунды
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
      // ✅ Фолбэк для старых браузеров
      fallbackCopy(url || window.location.href);
    }
  };

  // ✅ Фолбэк: если navigator.clipboard не доступен
  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Fallback copy failed", err);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  // ✅ Вариант: только иконка (для хедера/комментариев)
  if (variant === "icon") {
    return (
      <button
        onClick={handleCopy}
        className={`relative group p-2 rounded-lg transition ${
          copied
            ? "text-green-600 bg-green-50"
            : "text-gray-500 hover:text-purple-600 hover:bg-purple-50"
        } ${className}`}
        title={copied ? "Скопировано!" : "Копировать ссылку"}
      >
        {copied ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />}

        {/* Тултип */}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
          {copied ? "✓ Скопировано!" : "Копировать ссылку"}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </span>
      </button>
    );
  }

  // ✅ Вариант: кнопка с текстом (для статей/уроков)
  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
        copied
          ? "bg-green-100 text-green-700 border border-green-300"
          : "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          <span>Скопировано!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
