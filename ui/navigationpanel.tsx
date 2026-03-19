"use client";
import Link from "next/link";
import useContactStore from "@/store/states";
function NavigationPanel() {
  const { navigationState, toggleNavigation } = useContactStore();

  return (
    <main>
      {navigationState && (
        <div className="min-w-full absolute  z-20  min-h-full flex  flex-1">
          <div className="bg-white shadow-lg rounded-[10px] w-full flex flex-col p-[10px] px-[20px]  h-[200px]">
            <Link
              onClick={toggleNavigation}
              href="/"
              className="cursor-pointer font-semibold"
            >
              Домой
            </Link>

            <Link
              onClick={toggleNavigation}
              href="/english"
              className="cursor-pointer mt-[10px] font-semibold"
            >
              Английский
            </Link>
            <Link
              onClick={toggleNavigation}
              href="/maths"
              className="cursor-pointer mt-[10px] font-semibold"
            >
              Математика
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export default NavigationPanel;
