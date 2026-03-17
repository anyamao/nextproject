"use client";
import Link from "next/link";
import useContactStore from "@/store/states";
function NavigationPanel() {
  const { navigationState, toggleNavigation } = useContactStore();

  return (
    <main>
      {navigationState && (
        <div className="min-w-full absolute  z-20  min-h-full flex  flex-1">
          <div className="bg-pink-100 shadow-lg rounded-[10px] w-full  h-[200px]">
            <Link
              onClick={toggleNavigation}
              href="/english"
              className="cursor-pointer"
            >
              English
            </Link>
            <Link
              onClick={toggleNavigation}
              href="/maths"
              className="cursor-pointer"
            >
              Maths
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export default NavigationPanel;
