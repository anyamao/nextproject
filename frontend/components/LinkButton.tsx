"use client";

import { useState } from "react";
import { Link, Check, Copy } from "lucide-react";

interface CopyLinkButtonProps {
  url?: string;
  label?: string;
  variant?: "icon" | "button";
  className?: string;
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
      const linkToCopy = url || window.location.href;

      await navigator.clipboard.writeText(linkToCopy);

      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      fallbackCopy(url || window.location.href);
    }
  };

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
    } finally {
      document.body.removeChild(textarea);
    }
  };

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

        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
          {copied ? "✓ Скопировано!" : "Копировать ссылку"}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </span>
      </button>
    );
  }

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
