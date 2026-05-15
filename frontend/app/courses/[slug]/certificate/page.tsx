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
  Star,
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

  const handleDownload = async () => {
    if (!certificate || !certificateRef.current) return;

    setDownloading(true);
    try {
      const originalConfetti = document.querySelectorAll(".confetti");
      originalConfetti.forEach(
        (el) => ((el as HTMLElement).style.display = "none"),
      );

      const canvas = await html2canvas(certificateRef.current, {
        scale: 4, // 🔥 4x = ~300 DPI для печати
        backgroundColor: "#fffbeb",
        useCORS: true,
        allowTaint: true,
        logging: false,
        foreignObjectRendering: true,
        removeContainer: true,

        ignoreElements: (element) => {
          // 🔥 Приводим Element → HTMLElement для доступа к style
          const el = element as HTMLElement;

          if (el.classList?.contains("confetti")) return true;
          if (el.classList?.contains("animate-pulse")) return true;
          if (el.classList?.contains("animate-bounce")) return true;
          if (el.style?.backdropFilter?.includes("blur")) return true; // ✅ Теперь работает
          return false;
        },
      });

      originalConfetti.forEach(
        (el) => ((el as HTMLElement).style.display = ""),
      );

      const link = document.createElement("a");
      link.download = `certificate-${certificate.certificate_id}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (err) {
      console.error("❌ html2canvas failed, using fallback:", err);
      await downloadCertificateFallback();
    } finally {
      setDownloading(false);
    }
  };

  const downloadCertificateFallback = async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    const width = 1600;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      width * 0.8,
    );
    bgGradient.addColorStop(0, "#fffbeb");
    bgGradient.addColorStop(0.5, "#ffffff");
    bgGradient.addColorStop(1, "#fef3c7");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = width / 2 + Math.cos(angle) * 300;
      const y = height / 2 + Math.sin(angle) * 200;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 25;
    ctx.strokeRect(15, 15, width - 30, height - 30);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, width - 100, height - 100);
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 70, width - 140, height - 140);

    const drawCorner = (x: number, y: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.quadraticCurveTo(40, -30, 40, 0);
      ctx.quadraticCurveTo(40, 30, 0, 60);
      ctx.stroke();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.quadraticCurveTo(25, -20, 25, 0);
      ctx.quadraticCurveTo(25, 20, 0, 40);
      ctx.stroke();
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawCorner(80, 80, 0);
    drawCorner(width - 80, 80, Math.PI / 2);
    drawCorner(80, height - 80, -Math.PI / 2);
    drawCorner(width - 80, height - 80, Math.PI);

    ctx.save();
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(width / 2, 140, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(width / 2, 140, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🏆", width / 2, 155);
    ctx.restore();

    ctx.fillStyle = "#92400e";
    ctx.font = "bold 68px 'Georgia', 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText("СВИДЕТЕЛЬСТВО", width / 2, 240);

    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 180, 270);
    ctx.lineTo(width / 2 - 40, 270);
    ctx.moveTo(width / 2 + 40, 270);
    ctx.lineTo(width / 2 + 180, 270);
    ctx.stroke();
    ctx.fillStyle = "#f59e0b";
    ctx.font = "20px Arial";
    ctx.fillText("✦", width / 2, 278);

    ctx.fillStyle = "#6b7280";
    ctx.font = "italic 28px 'Georgia', serif";
    ctx.fillText("об успешном окончании курса", width / 2, 320);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "18px 'Arial', sans-serif";
    ctx.fillText("Настоящим удостоверяется, что", width / 2, 380);

    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 56px 'Georgia', serif";
    if (!certificate) return;
    ctx.fillText(certificate.user_full_name, width / 2, 460);

    const underlineGradient = ctx.createLinearGradient(
      width / 2 - 280,
      480,
      width / 2 + 280,
      480,
    );
    underlineGradient.addColorStop(0, "transparent");
    underlineGradient.addColorStop(0.5, "#fbbf24");
    underlineGradient.addColorStop(1, "transparent");
    ctx.strokeStyle = underlineGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 280, 480);
    ctx.lineTo(width / 2 + 280, 480);
    ctx.stroke();

    ctx.fillStyle = "#9ca3af";
    ctx.font = "18px 'Arial', sans-serif";
    ctx.fillText(
      "успешно завершил(а) образовательную программу",
      width / 2,
      550,
    );

    ctx.fillStyle = "#f3e8ff";
    ctx.strokeStyle = "#e9d5ff";
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.roundRect(width / 2 - 420, 570, 840, 90, 20);
    } else {
      ctx.beginPath();
      ctx.moveTo(width / 2 - 400, 570);
      ctx.lineTo(width / 2 + 400, 570);
      ctx.quadraticCurveTo(width / 2 + 420, 570, width / 2 + 420, 590);
      ctx.lineTo(width / 2 + 420, 640);
      ctx.quadraticCurveTo(width / 2 + 420, 660, width / 2 + 400, 660);
      ctx.lineTo(width / 2 - 400, 660);
      ctx.quadraticCurveTo(width / 2 - 420, 660, width / 2 - 420, 640);
      ctx.lineTo(width / 2 - 420, 590);
      ctx.quadraticCurveTo(width / 2 - 420, 570, width / 2 - 400, 570);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#7c3aed";
    ctx.font = "bold 36px 'Georgia', serif";
    ctx.fillText(`"${certificate.course_title}"`, width / 2, 630);

    const centerX = width / 2;
    const centerY = 820;
    const radius = 75;
    const progress = certificate.completion_percent / 100;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fef3c7";
    ctx.fill();
    ctx.strokeStyle = "#fcd34d";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius - 4,
      -Math.PI / 2,
      -Math.PI / 2 + 2 * Math.PI * progress,
    );
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.fillStyle = "#059669";
    ctx.font = "bold 42px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${certificate.completion_percent}%`, centerX, centerY + 14);

    ctx.fillStyle = "#6b7280";
    ctx.font = "16px 'Arial', sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 16px 'Arial', sans-serif";

    ctx.textAlign = "left";
    ctx.fillStyle = "#6b7280";
    ctx.font = "16px 'Arial', sans-serif";
    ctx.fillText(
      `Дата выдачи: ${certificate.completion_date}`,
      100,
      height - 150,
    );

    ctx.textAlign = "right";
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillText(certificate.certificate_id, width - 100, height - 150);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "14px 'Arial', sans-serif";
    ctx.fillText("MaoSchool.ru", width - 100, height - 125);

    ctx.textAlign = "center";
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(300, height - 220);
    ctx.lineTo(500, height - 220);
    ctx.stroke();
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px 'Arial', sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px 'Arial', sans-serif";
    ctx.fillText("MaoSchool.ru", 400, height - 180);

    ctx.beginPath();
    ctx.moveTo(width - 500, height - 220);
    ctx.lineTo(width - 300, height - 220);
    ctx.stroke();
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px 'Arial', sans-serif";
    ctx.fillStyle = "#9ca3af";

    ctx.save();
    ctx.translate(width - 200, height - 240);
    ctx.rotate((-12 * Math.PI) / 180);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#92400e";
    ctx.font = "bold 13px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ОРИГИНАЛ", 0, -8);
    ctx.font = "10px 'Arial', sans-serif";
    ctx.fillText("MaoSchool", 0, 8);
    ctx.fillText("✓ Проверено", 0, 22);
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    if (ctx.roundRect) {
      ctx.roundRect(80, height - 280, 110, 110, 12);
    } else {
      ctx.beginPath();
      ctx.moveTo(92, height - 280);
      ctx.lineTo(178, height - 280);
      ctx.lineTo(190, height - 268);
      ctx.lineTo(190, height - 182);
      ctx.lineTo(178, height - 170);
      ctx.lineTo(92, height - 170);
      ctx.lineTo(80, height - 182);
      ctx.lineTo(80, height - 268);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#92400e";
    ctx.font = "bold 180px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("★", width / 2, height / 2 + 20);
    ctx.restore();

    ctx.fillStyle = "#fbbf24";
    ctx.font = "24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("✦", 30, 40);
    ctx.textAlign = "right";
    ctx.fillText("✦", width - 30, 40);
    ctx.textAlign = "left";
    ctx.fillText("✦", 30, height - 30);
    ctx.textAlign = "right";
    ctx.fillText("✦", width - 30, height - 30);

    const link = document.createElement("a");
    link.download = `certificate-${certificate.certificate_id}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (certificate && typeof window !== "undefined") {
      const colors = ["#fbbf24", "#f59e0b", "#fcd34d", "#fde68a", "#a78bfa"];
      for (let i = 0; i < 40; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.cssText = `
          position: fixed;
          width: 8px;
          height: 8px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}%;
          top: -10px;
          border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
          animation: fall ${3 + Math.random() * 2}s linear forwards;
          z-index: 50;
          pointer-events: none;
          opacity: 0.8;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 6000);
      }

      const style = document.createElement("style");
      style.textContent = `
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg) scale(0);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
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
    <main className="flex-1 flex flex-col items-center py-8 px-4  min-h-screen">
      <div className="w-full max-w-5xl mb-6">
        <Link
          href={`/courses/promo/${slug}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-amber-600 transition"
        >
          <ArrowLeft className="w-5 h-5" /> Вернуться к курсу
        </Link>
      </div>

      <div
        ref={certificateRef}
        data-certificate
        className="relative w-full max-w-4xl bg-[#fffbeb] rounded-3xl shadow-2xl overflow-hidden"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          border: "4px solid #f59e0b",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.08) 0%, transparent 40%)`,
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: "25px solid #f59e0b",
            borderRadius: "24px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: "4px solid #fbbf24",
            borderRadius: "20px",
            margin: "35px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: "2px solid #fde68a",
            borderRadius: "16px",
            margin: "55px",
          }}
        />

        {[
          { top: "20px", left: "20px", rot: "rotate(0deg)" },
          { top: "20px", right: "20px", rot: "rotate(90deg)" },
          { bottom: "20px", left: "20px", rot: "rotate(-90deg)" },
          { bottom: "20px", right: "20px", rot: "rotate(180deg)" },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-24 h-24 pointer-events-none"
            style={{ ...pos }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M50 10 Q75 30 75 50 Q75 70 50 90 Q25 70 25 50 Q25 30 50 10"
                stroke="#d97706"
                strokeWidth="5"
                fill="none"
              />
              <path
                d="M50 25 Q65 38 65 50 Q65 62 50 75 Q35 62 35 50 Q35 38 50 25"
                stroke="#fbbf24"
                strokeWidth="3"
                fill="none"
              />
              <circle cx="50" cy="50" r="8" fill="#f59e0b" />
            </svg>
          </div>
        ))}

        <div className="relative z-10 px-12 sm:px-16 pt-12 pb-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)",
                  border: "4px solid #ffffff",
                }}
              >
                <div
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center"
                  style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.1)" }}
                >
                  <Award className="w-12 h-12 text-amber-500" />
                </div>
              </div>
              <div
                className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: "#fbbf24" }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <h1
            className="text-5xl sm:text-6xl font-bold mb-3"
            style={{
              color: "#92400e",
              textShadow: "0 2px 4px rgba(217, 119, 6, 0.2)",
            }}
          >
            СВИДЕТЕЛЬСТВО
          </h1>

          <div className="flex justify-center items-center gap-3 mb-5">
            <div
              className="flex-1 h-px"
              style={{
                background:
                  "linear-gradient(to right, transparent, #fbbf24, #fde68a, #fbbf24, transparent)",
              }}
            />
            <Star className="w-5 h-5 text-amber-500" />
            <div
              className="flex-1 h-px"
              style={{
                background:
                  "linear-gradient(to left, transparent, #fbbf24, #fde68a, #fbbf24, transparent)",
              }}
            />
          </div>

          <p
            className="text-xl mb-10 italic"
            style={{ color: "#6b7280", fontFamily: "'Georgia', serif" }}
          >
            об успешном окончании курса
          </p>

          <p
            className="text-sm mb-3 uppercase tracking-widest font-medium"
            style={{ color: "#9ca3af" }}
          >
            Настоящим удостоверяется, что
          </p>
          <div className="relative inline-block mb-8">
            <p
              className="text-4xl sm:text-5xl font-bold px-6 py-2"
              style={{ color: "#1f2937" }}
            >
              {certificate.user_full_name}
            </p>
            <div
              className="absolute -bottom-1 left-0 right-0 h-0.5"
              style={{
                background:
                  "linear-gradient(to right, transparent, #fbbf24, transparent)",
              }}
            />
          </div>

          <p
            className="text-sm mb-3 uppercase tracking-widest font-medium"
            style={{ color: "#9ca3af" }}
          >
            успешно завершил(а) образовательную программу
          </p>
          <div
            className="inline-block rounded-2xl px-10 py-5 mb-10"
            style={{
              background: "linear-gradient(135deg, #f3e8ff 0%, #fef3c7 100%)",
              border: "2px solid #e9d5ff",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <p
              className="text-2xl sm:text-3xl font-semibold leading-relaxed"
              style={{ color: "#7c3aed" }}
            >
              «{certificate.course_title}»
            </p>
          </div>

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
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - certificate.completion_percent / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#059669" }}
                >
                  {certificate.completion_percent}%
                </span>
              </div>
            </div>
            <div className="text-left">
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "#374151" }}
              ></p>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-8 pt-8"
            style={{ borderTop: "2px solid #fde68a" }}
          >
            <div className="text-left">
              <p
                className="text-xs mb-2 uppercase tracking-wide"
                style={{ color: "#9ca3af" }}
              >
                Дата выдачи
              </p>
              <p className="font-semibold text-lg" style={{ color: "#1f2937" }}>
                {certificate.completion_date}
              </p>
            </div>

            <div className="text-right">
              <p
                className="text-xs mb-2 uppercase tracking-wide"
                style={{ color: "#9ca3af" }}
              >
                Номер сертификата
              </p>
              <span
                className="font-mono text-sm font-medium inline-block px-3 py-1 rounded"
                style={{
                  color: "#1f2937",
                  background: "rgba(251, 191, 36, 0.15)",
                }}
              >
                {certificate.certificate_id}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mt-12 pt-8">
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "#374151" }}>
                Руководитель платформы
              </p>
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                MaoSchool.ru
              </p>
            </div>
          </div>

          <div
            className="absolute bottom-20 right-20 w-28 h-28 rounded-full flex items-center justify-center opacity-85"
            style={{
              border: "4px solid #f59e0b",
              transform: "rotate(-12deg)",
            }}
          >
            <div className="text-center">
              <p
                className="text-xs font-bold leading-tight"
                style={{ color: "#92400e" }}
              >
                ОРИГИНАЛ
              </p>
              <p className="text-[10px] mt-1" style={{ color: "#b45309" }}>
                MaoSchool
              </p>
              <p
                className="text-[9px] mt-1 font-medium"
                style={{ color: "#10b981" }}
              >
                ✓ Проверено
              </p>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Star
              className="w-80 h-80"
              style={{ color: "#92400e", opacity: "0.04" }}
            />
          </div>

          <Star
            className="absolute top-5 left-5 w-6 h-6"
            style={{ color: "#fbbf24" }}
          />
          <Star
            className="absolute top-5 right-5 w-6 h-6"
            style={{ color: "#fbbf24" }}
          />
          <Star
            className="absolute bottom-5 left-5 w-6 h-6"
            style={{ color: "#fbbf24" }}
          />
          <Star
            className="absolute bottom-5 right-5 w-6 h-6"
            style={{ color: "#fbbf24" }}
          />
        </div>

        <div
          className="absolute bottom-0 left-0 w-full h-3"
          style={{
            background:
              "linear-gradient(to right, #f59e0b, #fbbf24, #fde68a, #fbbf24, #f59e0b)",
          }}
        />
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
      bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-xl active:scale-[0.98]"
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
          className="px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-sm
      bg-white text-gray-700 border-2 border-gray-200
      hover:bg-gray-50 hover:border-gray-300 hover:shadow-md active:scale-[0.98]"
        >
          Назад к курсу
        </Link>
      </div>
    </main>
  );
}
