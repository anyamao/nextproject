// components/Toast.tsx
"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, Sparkles } from "lucide-react";

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
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      bg: "from-emerald-500 to-emerald-600",
      icon: <Sparkles className="w-5 h-5" />,
      progressBg: "bg-emerald-300",
      title: "Отлично!",
    },
    error: {
      bg: "from-rose-500 to-rose-600",
      icon: <AlertCircle className="w-5 h-5" />,
      progressBg: "bg-rose-300",
      title: "Упс!",
    },
    info: {
      bg: "from-sky-500 to-sky-600",
      icon: <Info className="w-5 h-5" />,
      progressBg: "bg-sky-300",
      title: "К сведению",
    },
  };

  return (
    <div
      className={`fixed top-50 right-4 z-50 transition-all duration-300 ${
        isExiting ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"
      }`}
    >
      <div
        className={`bg-gradient-to-r ${config[type].bg} text-white rounded-xl shadow-2xl min-w-[340px] max-w-[420px] overflow-hidden`}
      >
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30" />

          <div className="flex items-start justify-between gap-3 p-4 pl-5">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                {config[type].icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold tracking-wide">
                  {config[type].title}
                </p>
                <p className="text-xs text-white/90 mt-0.5 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsExiting(true);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-full h-1 bg-white/20">
            <div
              className={`h-full ${config[type].progressBg} rounded-full transition-all duration-[3000ms] linear`}
              style={{
                width: "100%",
                animation: "shrink 3s linear forwards",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
