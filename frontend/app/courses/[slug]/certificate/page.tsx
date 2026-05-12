// frontend/app/courses/[slug]/certificate/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Award } from "lucide-react";
import { apiFetch } from "@/lib/api";
import html2canvas from "html2canvas"; // 🔥 Установи: pnpm add html2canvas
import { toPng } from "html-to-image";

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

        // 1️⃣ Загружаем данные курса ЧЕРЕЗ /promo
        const courseData = await apiFetch(`/courses/promo/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("🔍 [Certificate] Course data:", courseData); // 🔥 Отладка

        if (courseData.completion_percent < 90) {
          router.push(`/courses/${slug}`);
          return;
        }

        // 2️⃣ Загружаем профиль пользователя
        const profile = await apiFetch("/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fullName =
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          profile.username;

        // 3️⃣ Формируем данные сертификата
        setCertificate({
          course_title: courseData.title || "Курс", // 🔥 Фоллбэк
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
  // 🔹 Скачивание как изображение
  // 🔹 Скачивание как изображение

  // 🔹 Скачивание через Canvas (без html2canvas)
  const handleDownload = async () => {
    if (!certificate) return;

    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Размеры
      const width = 1200;
      const height = 900;
      canvas.width = width;
      canvas.height = height;

      // Фон
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Рамка
      ctx.strokeStyle = "#eab308"; // yellow-500
      ctx.lineWidth = 20;
      ctx.strokeRect(0, 0, width, height);

      // Угловые орнаменты
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 8;
      // Верхний левый
      ctx.beginPath();
      ctx.moveTo(40, 100);
      ctx.lineTo(40, 40);
      ctx.lineTo(100, 40);
      ctx.stroke();
      // Верхний правый
      ctx.beginPath();
      ctx.moveTo(width - 100, 40);
      ctx.lineTo(width - 40, 40);
      ctx.lineTo(width - 40, 100);
      ctx.stroke();
      // Нижний левый
      ctx.beginPath();
      ctx.moveTo(40, height - 100);
      ctx.lineTo(40, height - 40);
      ctx.lineTo(100, height - 40);
      ctx.stroke();
      // Нижний правый
      ctx.beginPath();
      ctx.moveTo(width - 100, height - 40);
      ctx.lineTo(width - 40, height - 40);
      ctx.lineTo(width - 40, height - 100);
      ctx.stroke();

      // Заголовок
      ctx.fillStyle = "#111827"; // gray-900
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("СЕРТИФИКАТ", width / 2, 150);

      ctx.fillStyle = "#4b5563"; // gray-600
      ctx.font = "24px Arial";
      ctx.fillText("об окончании курса", width / 2, 190);

      // Текст "Настоящим подтверждается, что"
      ctx.fillStyle = "#6b7280"; // gray-500
      ctx.font = "18px Arial";
      ctx.fillText("Настоящим подтверждается, что", width / 2, 260);

      // Имя
      ctx.fillStyle = "#111827";
      ctx.font = "bold 42px Arial";
      ctx.fillText(certificate.user_full_name, width / 2, 320);

      // Подпись под именем
      ctx.strokeStyle = "#fde047"; // yellow-200
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 200, 340);
      ctx.lineTo(width / 2 + 200, 340);
      ctx.stroke();

      // Текст "успешно завершил(а) курс"
      ctx.fillStyle = "#6b7280";
      ctx.font = "18px Arial";
      ctx.fillText("успешно завершил(а) курс", width / 2, 400);

      // Название курса
      ctx.fillStyle = "#7c3aed"; // purple-700
      ctx.font = "bold 32px Arial";
      ctx.fillText(`"${certificate.course_title}"`, width / 2, 460);

      // Процент
      ctx.fillStyle = "#15803d"; // green-700
      ctx.font = "bold 48px Arial";
      ctx.fillText(`${certificate.completion_percent}%`, width / 2, 560);
      ctx.fillStyle = "#6b7280";
      ctx.font = "18px Arial";
      ctx.fillText("прогресс прохождения", width / 2, 595);

      // Дата и номер
      ctx.fillStyle = "#6b7280";
      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(
        `Дата выдачи: ${certificate.completion_date}`,
        80,
        height - 80,
      );

      ctx.textAlign = "right";
      ctx.fillText(certificate.certificate_id, width - 80, height - 80);
      ctx.fillText("MaoSchool.ru", width - 80, height - 60);

      // Скачивание
      const link = document.createElement("a");
      link.download = `certificate-${slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("❌ Failed to download:", err);
      alert("Не удалось скачать сертификат");
    } finally {
      setDownloading(false);
    }
  };
  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
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
    <main className="flex-1 flex flex-col   pt-[30px] h-full items-center z-20  bg-gray-50">
      <div className="w-full max-w-4xl mb-6">
        <Link
          href={`/courses/promo/${slug}`}
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Вернуться к курсу
        </Link>
      </div>
      <div
        ref={certificateRef}
        className="w-full max-w-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50 rounded-2xl shadow-2xl border-8 border-amber-500 p-8 sm:p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, #fffbeb 100%)",
        }}
      >
        {/* Фоновый узор из лавровых ветвей */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-6xl">🏆</div>
          <div className="absolute bottom-10 right-10 text-6xl">🏆</div>
          <div className="absolute top-1/2 left-5 text-4xl transform -translate-y-1/2">
            ✨
          </div>
          <div className="absolute top-1/2 right-5 text-4xl transform -translate-y-1/2">
            ✨
          </div>
        </div>

        {/* Золотая рамка с градиентом */}
        <div className="absolute inset-4 border-2 border-amber-400/50 rounded-xl pointer-events-none" />

        {/* Верхняя декоративная полоса */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

        {/* Угловые орнаменты - улучшенные */}
        <div className="absolute top-6 left-6 w-24 h-24">
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-500 rounded-tl-xl" />
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-300 rounded-tl-lg" />
        </div>
        <div className="absolute top-6 right-6 w-24 h-24">
          <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-500 rounded-tr-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-300 rounded-tr-lg" />
        </div>
        <div className="absolute bottom-6 left-6 w-24 h-24">
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-500 rounded-bl-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-300 rounded-bl-lg" />
        </div>
        <div className="absolute bottom-6 right-6 w-24 h-24">
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-500 rounded-br-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-300 rounded-br-lg" />
        </div>

        {/* Контент сертификата */}
        <div className="text-center relative z-10">
          {/* Золотая медаль/логотип */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <Award className="w-12 h-12 text-amber-500" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs animate-pulse">
                ✨
              </div>
            </div>
          </div>

          {/* Заголовок с золотым градиентом */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent">
            СВИДЕТЕЛЬСТВО
          </h1>

          {/* Декоративная линия под заголовком */}
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-400" />
            <div className="w-2 h-2 bg-amber-400 rounded-full" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-400" />
          </div>

          <p className="text-lg text-gray-600 mb-8 italic">
            об окончании курса
          </p>

          {/* Имя получателя с золотым подчеркиванием */}
          <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">
            Настоящим подтверждается, что
          </p>
          <div className="relative inline-block mb-6">
            <p className="text-3xl sm:text-4xl font-bold text-gray-800 px-4">
              {certificate.user_full_name}
            </p>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" />
          </div>

          {/* Название курса с красивым фоном */}
          <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">
            успешно завершил(а) курс
          </p>
          <div className="inline-block bg-gradient-to-r from-purple-50 via-purple-100 to-purple-50 rounded-xl p-4 px-8 mb-6 shadow-inner">
            <p className="text-xl sm:text-2xl font-semibold text-purple-700">
              «{certificate.course_title}»
            </p>
          </div>

          {/* Прогресс с круговой диаграммой */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className="relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#10b981"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - certificate.completion_percent / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">
                  {certificate.completion_percent}%
                </span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-700">
                прогресс прохождения
              </p>
              <p className="text-xs text-gray-500">отлично!</p>
            </div>
          </div>

          {/* Нижняя часть с датой и подписями */}
          <div className="flex justify-between items-end text-sm pt-6 border-t-2 border-amber-200">
            <div className="text-left">
              <p className="text-xs text-gray-500 mb-1">Дата выдачи</p>
              <p className="font-semibold text-gray-700">
                {certificate.completion_date}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Номер сертификата</p>
              <p className="font-mono text-sm font-medium text-gray-700">
                {certificate.certificate_id}
              </p>
              <p className="text-xs text-amber-600 mt-1">MaoSchool.ru</p>
            </div>
          </div>

          {/* Водяной знак */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <Award className="w-64 h-64 text-amber-800" />
          </div>
        </div>
      </div>
      {/* 🔹 Кнопка скачивания */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition disabled:opacity-50"
        >
          {downloading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Подготовка...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Скачать как изображение
            </>
          )}
        </button>
        <Link
          href={`/courses/promo/${slug}`}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
        >
          Назад к курсу
        </Link>
      </div>
    </main>
  );
}
