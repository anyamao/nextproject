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
    <main className="flex-1 flex flex-col items-center px-4 py-8 w-full bg-gray-50">
      <div className="w-full max-w-4xl mb-6">
        <Link
          href={`/courses/${slug}`}
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Вернуться к курсу
        </Link>
      </div>

      {/* 🔹 Сам сертификат */}
      {/* 🔹 Сам сертификат */}
      <div
        ref={certificateRef}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border-8 border-yellow-500 p-8 sm:p-12 relative overflow-hidden"
        style={{
          // 🔥 Простые цвета вместо градиентов
          backgroundImage: "none",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Декоративные элементы - упрощённые */}
        <div className="absolute top-0 left-0 w-full h-3 bg-yellow-500" />
        <div className="absolute bottom-0 left-0 w-full h-3 bg-yellow-500" />

        {/* Угловые орнаменты - простые рамки */}
        <div className="absolute top-4 left-4 w-20 h-20 border-t-4 border-l-4 border-yellow-500" />
        <div className="absolute top-4 right-4 w-20 h-20 border-t-4 border-r-4 border-yellow-500" />
        <div className="absolute bottom-4 left-4 w-20 h-20 border-b-4 border-l-4 border-yellow-500" />
        <div className="absolute bottom-4 right-4 w-20 h-20 border-b-4 border-r-4 border-yellow-500" />

        {/* Контент сертификата */}
        <div className="text-center relative z-10">
          {/* Логотип / иконка */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <Award className="w-10 h-10 text-yellow-600" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            СЕРТИФИКАТ
          </h1>
          <p className="text-lg text-gray-600 mb-8">об окончании курса</p>

          {/* Имя получателя */}
          <p className="text-sm text-gray-500 mb-2">
            Настоящим подтверждается, что
          </p>
          <div className="border-b-2 border-yellow-400 pb-4 mb-6">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {certificate.user_full_name}
            </p>
          </div>

          {/* Название курса */}
          <p className="text-sm text-gray-500 mb-2">успешно завершил(а) курс</p>
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <p className="text-xl sm:text-2xl font-semibold text-purple-700">
              «{certificate.course_title}»
            </p>
          </div>

          {/* Процент завершения */}
          <div className="flex justify-center items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-green-700">
                {certificate.completion_percent}%
              </span>
            </div>
            <p className="text-sm text-gray-600">прогресс прохождения</p>
          </div>

          {/* Дата и номер */}
          <div className="flex justify-between items-end text-sm text-gray-500 pt-6 border-t border-gray-200">
            <div>
              <p>Дата выдачи: {certificate.completion_date}</p>
            </div>
            <div className="text-right">
              <p className="font-mono">{certificate.certificate_id}</p>
              <p className="text-xs mt-1">MaoSchool.ru</p>
            </div>
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
          href={`/courses/${slug}`}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
        >
          Назад к курсу
        </Link>
      </div>
    </main>
  );
}
