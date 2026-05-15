"use client";

import { ArrowLeft, TableOfContents } from "lucide-react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import "../../globals.css";
import CourseSidePanel from "../../../ui/CourseSidePanel";
import useContactStore from "@/store/states";
type CourseMeta = {
  title: string;
  slug: string;
  is_enrolled: boolean;
  completion_percent: number;
  total_units: number; // 🔥 Добавляем в тип
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [enrolling, setEnrolling] = useState(false);

  const slug = params.slug as string;
  const isCertificatePage = pathname?.includes("/certificate");
  const { isAuthenticated, openLogin } = useContactStore();
  const [meta, setMeta] = useState<CourseMeta | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchMeta() {
      try {
        const data = await apiFetch(`/courses/${slug}/meta`);
        setMeta(data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchMeta();
  }, [slug]);
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (!meta?.slug) return;

    setEnrolling(true);
    try {
      await apiFetch(`/courses/${meta.slug}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const updatedMeta = await apiFetch(`/courses/${slug}/meta`);
      setMeta(updatedMeta);
    } catch (err: any) {
      alert(err.message || "Ошибка при записи");
    } finally {
      setEnrolling(false);
    }
  };
  const pathParts = pathname.split("/").filter(Boolean);
  const currentLessonSlug =
    pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;
  const isLessonPage = pathParts.length == 2;
  if (loading || !meta) {
    return (
      <div className="flex flex-col w-full h-full max-w-[1100px]">
        <div className="flex justify-center py-20"></div>
      </div>
    );
  }
  const totalUnits = meta?.total_units || 1;
  const completedUnits = Math.floor(
    (meta.completion_percent / 100) * totalUnits,
  );

  return (
    <div className="flex flex-col w-full h-full max-w-[1200px]">
      <div
        className={` flex-row items-center mt-[30px] justify-between ${isCertificatePage ? "hidden" : "flex"} `}
      >
        <div
          className="flex flex-row items-center text-purple-600 font-semibold text-sm cursor-pointer hover:text-purple-700 transition"
          onClick={() => router.push(`/courses/promo/${slug}`)}
        >
          <ArrowLeft className="w-5 h-5" />
          <p className="ml-[5px]">О курсе</p>
        </div>

        <div className="flex flex-row items-center text-gray-500 font-semibold text-xs">
          <span
            className="hover:text-purple-600 cursor-pointer transition"
            onClick={() => router.push("/courses")}
          >
            Курсы
          </span>
          <span className="mx-1">/</span>
          <span
            className="hover:text-purple-600 cursor-pointer transition truncate max-w-[200px]"
            onClick={() => router.push(`/courses/promo/${slug}`)}
            title={meta.title}
          >
            {meta.title}
          </span>
          {currentLessonSlug && (
            <>
              <span className="mx-1">/</span>
              <span
                className="text-gray-700 truncate max-w-[200px]"
                title={currentLessonSlug}
              >
                {currentLessonSlug}
              </span>
            </>
          )}
        </div>
      </div>
      {isLessonPage && (
        <div className="flex flex-row bg-gray-700 w-full rounded-lg mt-[20px] text-gray-100 items-center p-[20px] px-[30px]">
          <p className="font-bold text-md">Структура курса</p>

          <p className="text-sm ml-[10px]">
            Тут вы можете подробнее ознакомиться со структурой уроков курса
          </p>
        </div>
      )}

      <div
        className={`bg-white rounded-lg w-full justify-between shadow-xs h-[70px] my-[20px] p-[10px]  px-[20px]   ${isCertificatePage ? "hidden" : "flex"}    flex-row`}
      >
        <div className="flex flex-col">
          <p className="text-lg font-bold truncate">{meta.title}</p>
          <p className="text-gray-500 text-xs">
            {meta.is_enrolled
              ? "Вы записаны на курс"
              : "Запишитесь на курс, чтобы получить доступ ко всем урокам"}
          </p>
        </div>

        {meta.is_enrolled && (
          <div className="ml-[20px] items-end flex flex-col w-full flex-1">
            <div className="flex text-sm text-gray-800 mt-[5px] flex-row w-full items-center justify-between">
              <p className="text-sm">Прогресс по курсу</p>
              <p>
                {completedUnits}/{totalUnits} юнитов пройдено
              </p>
            </div>
            <div className="flex flex-row flex-1 w-full items-center">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${meta.completion_percent >= 90 ? "bg-green-500" : "bg-purple-500"}`}
                  style={{
                    width: `${Math.min(meta.completion_percent, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {!meta.is_enrolled && (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="flex p-[10px] items-center hover:bg-purple-600 cursor-pointer my-[5px] justify-center px-[20px] rounded-lg bg-purple-500 text-purple-100 disabled:opacity-50"
          >
            {enrolling ? "записываем..." : "записаться"}
          </button>
        )}
      </div>

      <div className="flex flex-row flex-1 relative w-full h-full">
        <CourseSidePanel />
        {children}
      </div>
    </div>
  );
}
