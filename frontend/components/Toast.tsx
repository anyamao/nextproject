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
  duration = 2000,
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
      bg: "bg-green-600",
      icon: <Sparkles className="w-5 h-5" />,
      progressBg: "bg-green-300",
      title: "Отлично!",
    },
    error: {
      bg: "bg-red-600",
      icon: <AlertCircle className="w-5 h-5" />,
      progressBg: "bg-red-300",
      title: "Упс!",
    },
    info: {
      bg: "bg-blue-600",
      icon: <Info className="w-5 h-5" />,
      progressBg: "bg-blue-300",
      title: "К сведению",
    },
  };

  return (
    <div
      className={`fixed top-35 right-4 z-50 transition-all duration-300 ${
        isExiting
          ? "opacity-0 -translate-y-4"
          : "opacity-100 translate-y-0 animate-slide-down"
      }`}
    >
      <div
        className={`${config[type].bg} text-white rounded-lg shadow-2xl min-w-[270px] max-w-[350px] overflow-hidden`}
      >
        <div className="relative">
          <div className="flex items-center justify-between gap-3 p-3 pl-5">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center">
                {config[type].icon}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-white/90 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsExiting(true);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
