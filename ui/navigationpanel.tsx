"use client";
import Link from "next/link";
import useContactStore from "@/store/states";
function NavigationPanel() {
  const { navigationState, toggleNavigation } = useContactStore();

  return (
    <main>
      {navigationState && (
        <div className="min-w-full absolute z-20  min-h-full flex flex-col  transition:all duration-300 backdrop-blur-xs flex-1">
          <div className="bg-white shadow-lg w-full items-center blur-none  flex flex-col p-[10px] px-[20px]  h-[200px]">
            <div className="max-w-[1300px] mt-[20px] w-full flex flex-col ">
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
          <div className="flex-1 w-full h-full blur-xs">.</div>
        </div>
      )}
    </main>
  );
}

export default NavigationPanel;
