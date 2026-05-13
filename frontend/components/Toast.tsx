// components/Toast.tsx
"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = "success",
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      bg: "bg-green-500",
      icon: <CheckCircle className="w-5 h-5" />,
      border: "border-green-400",
    },
    error: {
      bg: "bg-red-500",
      icon: <AlertCircle className="w-5 h-5" />,
      border: "border-red-400",
    },
    info: {
      bg: "bg-blue-500",
      icon: <Info className="w-5 h-5" />,
      border: "border-blue-400",
    },
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div
        className={`${config[type].bg} text-white rounded-lg shadow-lg p-4 min-w-[300px] flex items-center justify-between gap-3 border ${config[type].border}`}
      >
        <div className="flex items-center gap-2">
          {config[type].icon}
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button onClick={onClose} className="hover:opacity-80 transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
