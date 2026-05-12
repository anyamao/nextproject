// frontend/components/Toast.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Coins } from "lucide-react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
};

export default function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-purple-500",
  }[type];

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white ${bgColor} animate-slide-up`}
    >
      <Coins className="w-5 h-5" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          onClose();
        }}
        className="ml-2 p-1 hover:bg-white/20 rounded transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
