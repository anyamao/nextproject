"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import useContactStore from "@/store/states";

function NavigationPanel() {
  const { navigationState, toggleNavigation } = useContactStore();
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  // Handle animation on open/close
  useEffect(() => {
    if (navigationState) {
      setShouldRender(true);
      setIsAnimatingOut(false);
      setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
    } else if (shouldRender) {
      setIsAnimatingIn(false);
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimatingOut(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [navigationState, shouldRender]);

  if (!shouldRender) return null;

  return (
    <main>
      <div className="fixed inset-0 z-40">
        {/* Затемнение фона */}
        <div
          className={`absolute inset-0 bg-black/50 transition-all duration-300 ${
            isAnimatingOut
              ? "opacity-0"
              : isAnimatingIn
                ? "opacity-100"
                : "opacity-0"
          }`}
          onClick={toggleNavigation}
        />

        {/* Панель навигации - выезжает сверху */}
        <div
          className={`absolute top-0 left-0 right-0 bg-white shadow-lg z-50 transition-all duration-300 ${
            isAnimatingOut
              ? "-translate-y-full opacity-0"
              : isAnimatingIn
                ? "translate-y-0 opacity-100"
                : "-translate-y-full opacity-0"
          }`}
        >
          <div className="max-w-[1300px] mx-auto w-full flex flex-col p-[20px] px-[30px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Меню</h2>
              <button
                onClick={toggleNavigation}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col">
              <Link
                onClick={toggleNavigation}
                href="/"
                className="cursor-pointer ord-text font-semibold py-3 hover:text-purple-600 transition"
              >
                Домой
              </Link>

              <Link
                onClick={toggleNavigation}
                href="/courses/math-profile"
                className="cursor-pointer ord-text mt-[5px] py-3 hover:text-purple-600 transition"
              >
                ЕГЭ Математика
              </Link>

              <Link
                onClick={toggleNavigation}
                href="/courses/physics"
                className="cursor-pointer ord-text mt-[5px] py-3 hover:text-purple-600 transition"
              >
                ЕГЭ Физика
              </Link>

              <Link
                onClick={toggleNavigation}
                href="/courses/russian"
                className="cursor-pointer ord-text mt-[5px] py-3 hover:text-purple-600 transition"
              >
                ЕГЭ Русский
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default NavigationPanel;
