"use client";
import Link from "next/link";
import useContactStore from "@/store/states";
import { PanelLeft } from "lucide-react";
function NavigationPanel() {
  const { mathNavigationState, togglemathNavigation } = useContactStore();

  return (
    <main>
      <div className="flex flex-row absolute min-h-screen">
        {mathNavigationState && (
          <div className="min-h-full w-[300px] pt-[10px] flex flex-col  px-[10px] bg-red-200">
            <Link onClick={togglemathNavigation} href="/maths">
              Go back to all maths
            </Link>
            <Link onClick={togglemathNavigation} href="/maths/trigonometry">
              Trigonometry
            </Link>
          </div>
        )}
        <div className="min-h-full w-[50px] flex justify-center text-[rgba(0,0,0,0.5)] pt-[10px]  bg-red-200">
          <PanelLeft onClick={togglemathNavigation}></PanelLeft>
        </div>
      </div>
    </main>
  );
}

export default NavigationPanel;
