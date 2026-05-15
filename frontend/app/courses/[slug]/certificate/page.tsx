// frontend/app/courses/[slug]/certificate/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Award,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import html2canvas from "html2canvas";

type CertificateData = {
  course_title: string;
  user_full_name: string;
  completion_percent: number;
  completion_date: string;
  certificate_id: string;
};

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const certificateRef = useRef<HTMLDivElement>(null);

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchCertificate() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        const courseData = await apiFetch(`/courses/promo/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (courseData.completion_percent < 90) {
          router.push(`/courses/${slug}`);
          return;
        }

        const profile = await apiFetch("/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fullName =
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          profile.username;

        setCertificate({
          course_title: courseData.title || "Курс",
          user_full_name: fullName,
          completion_percent: courseData.completion_percent,
          completion_date: new Date().toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          certificate_id: `CERT-${slug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        });
      } catch (err) {
        console.error("❌ Failed to load certificate:", err);
        router.push(`/courses/${slug}`);
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchCertificate();
  }, [slug, router]);

  // 🔹 Скачивание с максимальным качеством и совместимостью
  const handleDownload = async () => {
    if (!certificate || !certificateRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 4, // 🔥 Высокое разрешение для печати (300 DPI)
        backgroundColor: "#fffbeb", // 🔥 Явный фон
        useCORS: true,
        allowTaint: true,
        logging: false,
        foreignObjectRendering: true, // 🔥 Лучше рендерит сложные стили
        removeContainer: true,
        // 🔥 Игнорируем элементы которые могут сломать рендер
        ignoreElements: (element) => {
          // Пропускаем анимированные элементы (конфетти, пульсация)
          if (element.classList?.contains("confetti")) return true;
          if (element.classList?.contains("animate-pulse")) return true;
          if (element.classList?.contains("animate-bounce")) return true;
          // Пропускаем элементы с backdrop-filter (не поддерживается)
          if (element.style?.backdropFilter?.includes("blur")) return true;
          return false;
        },
      });

      const link = document.createElement("a");
      link.download = `certificate-${certificate.certificate_id}.png`;
      link.href = canvas.toDataURL("image/png", 1.0); // 🔥 Максимальное качество
      link.click();
    } catch (err) {
      console.error("❌ Failed to download:", err);
      // 🔥 Фоллбэк — но теперь он тоже красивый!
      await downloadCertificateBeautifulFallback();
    } finally {
      setDownloading(false);
    }
  };

  // 🔹 Красивый фоллбэк через Canvas API
  const downloadCertificateBeautifulFallback = async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    // 🔥 Высокое разрешение
    const width = 1600;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    // 🔥 Фон с радиальными градиентами (поддерживается в Canvas)
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      width,
    );
    bgGradient.addColorStop(0, "#fffbeb");
    bgGradient.addColorStop(0.5, "#ffffff");
    bgGradient.addColorStop(1, "#fef3c7");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 🔥 Декоративная рамка
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 20;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Внутренняя рамка
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    // 🔥 Угловые орнаменты
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 8;
    const ornamentSize = 100;
    const corners = [
      { x: 60, y: 60, rot: 0 },
      { x: width - 60, y: 60, rot: 90 },
      { x: 60, y: height - 60, rot: -90 },
      { x: width - 60, y: height - 60, rot: 180 },
    ];

    corners.forEach(({ x, y, rot }) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -ornamentSize / 2);
      ctx.quadraticCurveTo(
        ornamentSize / 2,
        -ornamentSize / 4,
        ornamentSize / 2,
        0,
      );
      ctx.quadraticCurveTo(
        ornamentSize / 2,
        ornamentSize / 4,
        0,
        ornamentSize / 2,
      );
      ctx.stroke();
      ctx.restore();
    });

    // 🔥 Заголовок
    ctx.fillStyle = "#92400e";
    ctx.font = "bold 72px 'Georgia', 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText("СВИДЕТЕЛЬСТВО", width / 2, 180);

    // Подзаголовок
    ctx.fillStyle = "#6b7280";
    ctx.font = "italic 32px 'Georgia', serif";
    ctx.fillText("об успешном окончании курса", width / 2, 240);

    // 🔥 Декоративная линия
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 270);
    ctx.lineTo(width / 2 - 50, 270);
    ctx.moveTo(width / 2 + 50, 270);
    ctx.lineTo(width / 2 + 200, 270);
    ctx.stroke();

    // Точки на линии
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(width / 2, 270, 6, 0, Math.PI * 2);
    ctx.fill();

    // 🔥 Имя получателя
    ctx.fillStyle = "#9ca3af";
    ctx.font = "20px 'Arial', sans-serif";
    ctx.fillText("Настоящим удостоверяется, что", width / 2, 340);

    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 64px 'Georgia', serif";
    ctx.fillText(certificate.user_full_name, width / 2, 430);

    // Подчёркивание имени
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 300, 450);
    ctx.lineTo(width / 2 + 300, 450);
    ctx.stroke();

    // 🔥 Название курса
    ctx.fillStyle = "#9ca3af";
    ctx.font = "20px 'Arial', sans-serif";
    ctx.fillText(
      "успешно завершил(а) образовательную программу",
      width / 2,
      520,
    );

    // Фон для названия курса
    ctx.fillStyle = "#f3e8ff";
    ctx.roundRect(width / 2 - 400, 540, 800, 100, 20);
    ctx.fill();

    ctx.fillStyle = "#7c3aed";
    ctx.font = "bold 40px 'Georgia', serif";
    ctx.fillText(`"${certificate.course_title}"`, width / 2, 610);

    // 🔥 Прогресс с круговой диаграммой
    const centerX = width / 2;
    const centerY = 780;
    const radius = 80;
    const progress = certificate.completion_percent / 100;

    // Фон круга
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fef3c7";
    ctx.fill();
    ctx.strokeStyle = "#fcd34d";
    ctx.lineWidth = 10;
    ctx.stroke();

    // Прогресс (дуга)
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius - 5,
      -Math.PI / 2,
      -Math.PI / 2 + 2 * Math.PI * progress,
    );
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.stroke();

    // Процент в центре
    ctx.fillStyle = "#059669";
    ctx.font = "bold 48px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${certificate.completion_percent}%`, centerX, centerY + 16);

    // Подпись
    ctx.fillStyle = "#6b7280";
    ctx.font = "18px 'Arial', sans-serif";
    ctx.fillText("прогресс прохождения · отлично!", centerX, centerY + 70);

    // 🔥 Нижняя часть: дата и номер
    ctx.textAlign = "left";
    ctx.fillStyle = "#6b7280";
    ctx.font = "18px 'Arial', sans-serif";
    ctx.fillText(
      `Дата выдачи: ${certificate.completion_date}`,
      100,
      height - 140,
    );

    ctx.textAlign = "right";
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.fillText(certificate.certificate_id, width - 100, height - 140);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "16px 'Arial', sans-serif";
    ctx.fillText("MaoSchool.ru", width - 100, height - 115);

    // 🔥 Печать/штамп
    ctx.save();
    ctx.translate(width - 180, height - 200);
    ctx.rotate((-15 * Math.PI) / 180);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#92400e";
    ctx.font = "bold 14px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ОРИГИНАЛ", 0, -5);
    ctx.font = "10px 'Arial', sans-serif";
    ctx.fillText("MaoSchool", 0, 15);
    ctx.restore();

    // 🔥 QR-заглушка
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.roundRect(80, height - 240, 100, 100, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 12px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("QR", 130, height - 195);
    ctx.font = "9px 'Arial', sans-serif";
    ctx.fillText("Проверка", 130, height - 175);

    // 🔥 Водяной знак
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = "#92400e";
    ctx.font = "bold 200px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("★", width / 2, height / 2);
    ctx.restore();

    // 🔥 Скачивание
    const link = document.createElement("a");
    link.download = `certificate-${certificate.certificate_id}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  };

  // 🔹 Polyfill для roundRect если не поддерживается
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }
  // 🔹 Конфетти-анимация при загрузке
  useEffect(() => {
    if (certificate) {
      const colors = ["#fbbf24", "#f59e0b", "#fcd34d", "#fde68a", "#a78bfa"];
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}%;
          top: -10px;
          border-radius: ${Math.random() > 0.5 ? "50%" : "0"};
          animation: fall ${2 + Math.random() * 3}s linear forwards;
          z-index: 100;
          pointer-events: none;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
      }

      // 🔹 Добавляем CSS-анимацию динамически
      const style = document.createElement("style");
      style.textContent = `
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, [certificate]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600" />
      </main>
    );
  }

  if (!certificate) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-600 text-lg mb-4">
          Не удалось загрузить сертификат
        </p>
        <Link
          href={`/courses/${slug}`}
          className="text-purple-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться к курсу
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center py-8 px-4 bg-gradient-to-br from-amber-50 via-white to-yellow-50 min-h-screen">
      {/* 🔹 Кнопка "Назад" */}
      <div className="w-full max-w-4xl mb-6">
        <Link
          href={`/courses/promo/${slug}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-amber-600 transition"
        >
          <ArrowLeft className="w-5 h-5" /> Вернуться к курсу
        </Link>
      </div>

      {/* 🔹 Сам сертификат */}
      <div
        ref={certificateRef}
        className="relative w-full max-w-4xl bg-gradient-to-br from-amber-50 via-white to-yellow-50 rounded-3xl shadow-2xl border-4 border-amber-400 overflow-hidden"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        {/* 🔹 Фоновый паттерн */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 400 400">
            <defs>
              <pattern
                id="laurel"
                x="0"
                y="0"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M50 10 Q70 30 50 50 Q30 70 50 90"
                  stroke="#d97706"
                  strokeWidth="1"
                  fill="none"
                />
                <path
                  d="M50 10 Q30 30 50 50 Q70 70 50 90"
                  stroke="#d97706"
                  strokeWidth="1"
                  fill="none"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#laurel)" />
          </svg>
        </div>

        {/* 🔹 Декоративная рамка */}
        <div className="absolute inset-6 border-2 border-amber-300/60 rounded-2xl pointer-events-none" />
        <div className="absolute inset-8 border border-amber-200/40 rounded-xl pointer-events-none" />

        {/* 🔹 Угловые орнаменты */}
        {[
          "top-8 left-8 rotate-0",
          "top-8 right-8 rotate-90",
          "bottom-8 left-8 -rotate-90",
          "bottom-8 right-8 rotate-180",
        ].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-20 h-20`}>
            <svg viewBox="0 0 80 80" className="w-full h-full text-amber-500">
              <path
                d="M10 40 Q20 20 40 10 Q60 20 70 40 Q60 60 40 70 Q20 60 10 40"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="40" cy="40" r="8" fill="currentColor" opacity="0.3" />
            </svg>
          </div>
        ))}

        {/* 🔹 Контент сертификата */}
        <div className="relative z-10 p-12 sm:p-16 text-center">
          {/* 🔹 Логотип/медаль */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full blur-xl opacity-40 animate-pulse" />
              <div className="relative w-28 h-28 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                <Award className="w-14 h-14 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg shadow-lg animate-bounce">
                ✨
              </div>
            </div>
          </div>

          <h1
            className="text-amber-700 font-bold"
            style={{ textShadow: "0 2px 4px rgba(217, 119, 6, 0.2)" }}
          >
            СВИДЕТЕЛЬСТВО
          </h1>
          {/* 🔹 Декоративная линия */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-amber-300" />
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-400 to-amber-300" />
          </div>

          <p className="text-xl text-gray-600 mb-10 italic font-serif">
            об успешном окончании курса
          </p>

          {/* 🔹 Имя получателя */}
          <p className="text-sm text-gray-500 mb-3 uppercase tracking-widest font-medium">
            Настоящим удостоверяется, что
          </p>
          <div className="relative inline-block mb-8">
            <p className="text-4xl sm:text-5xl font-bold text-gray-800 px-6 py-2">
              {certificate.user_full_name}
            </p>
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          </div>

          {/* 🔹 Название курса */}
          <p className="text-sm text-gray-500 mb-3 uppercase tracking-widest font-medium">
            успешно завершил(а) образовательную программу
          </p>
          <div className="inline-block bg-gradient-to-r from-purple-50 via-amber-50 to-purple-50 rounded-2xl px-10 py-5 mb-10 shadow-inner border border-amber-200/50">
            <p className="text-2xl sm:text-3xl font-semibold text-purple-800 leading-relaxed">
              «{certificate.course_title}»
            </p>
          </div>

          {/* 🔹 Прогресс с круговой диаграммой */}
          <div className="flex justify-center items-center gap-6 mb-12">
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#fde68a"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - certificate.completion_percent / 100)}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="progressGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-700">
                  {certificate.completion_percent}%
                </span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-700 mb-1">
                прогресс прохождения
              </p>
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">отлично!</span>
              </div>
            </div>
          </div>

          {/* 🔹 Нижняя часть: дата, номер, подписи */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-amber-200">
            {/* Дата */}
            <div className="text-left">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                Дата выдачи
              </p>
              <p className="font-semibold text-gray-800 text-lg">
                {certificate.completion_date}
              </p>
            </div>

            {/* Номер сертификата */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                Номер сертификата
              </p>
              <p className="font-mono text-sm font-medium text-gray-800 bg-amber-100/50 px-3 py-1 rounded inline-block">
                {certificate.certificate_id}
              </p>
            </div>
          </div>

          {/* 🔹 Подписи (декоративные) */}
          <div className="grid grid-cols-2 gap-12 mt-12 pt-8">
            <div className="text-center">
              <div className="h-16 border-b border-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Руководитель платформы
              </p>
              <p className="text-xs text-gray-500">MaoSchool.ru</p>
            </div>
            <div className="text-center">
              <div className="h-16 border-b border-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Преподаватель курса
              </p>
              <p className="text-xs text-gray-500">Сертифицированный эксперт</p>
            </div>
          </div>

          {/* 🔹 Печать/штамп */}
          <div className="absolute bottom-16 right-16 w-24 h-24 border-4 border-amber-500/60 rounded-full flex items-center justify-center transform rotate-12 opacity-80">
            <div className="text-center">
              <p className="text-xs font-bold text-amber-700 leading-tight">
                ОРИГИНАЛ
              </p>
              <p className="text-[10px] text-amber-600 mt-1">MaoSchool</p>
            </div>
          </div>

          {/* 🔹 QR-код (заглушка) */}
          <div className="absolute bottom-16 left-16 w-20 h-20 bg-white border-2 border-amber-300 rounded-lg flex items-center justify-center shadow-sm">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-1 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">QR</span>
              </div>
              <p className="text-[9px] text-gray-400">Проверка</p>
            </div>
          </div>

          {/* 🔹 Водяной знак */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <Award className="w-96 h-96 text-amber-800" />
          </div>
        </div>

        {/* 🔹 Нижняя декоративная полоса */}
        <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
      </div>

      {/* 🔹 Кнопки действий */}
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-yellow-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Подготовка...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Скачать сертификат
            </>
          )}
        </button>
        <Link
          href={`/courses/promo/${slug}`}
          className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
        >
          Назад к курсу
        </Link>
      </div>

      {/* 🔹 Подсказка */}
      <p className="text-center text-sm text-gray-500 mt-6 max-w-md">
        💡 Совет: распечатайте сертификат или добавьте в портфолио!
      </p>
    </main>
  );
}
