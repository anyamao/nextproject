"use client";
import Link from "next/link";
import useContactStore from "@/store/states";
import { PanelLeft, ArrowBigLeft } from "lucide-react";
function NavigationPanel() {
  const { englishNavigationState, toggleenglishNavigation } = useContactStore();

  return (
    <main>
      <div className="flex flex-row absolute min-h-screen">
        {englishNavigationState && (
          <div className="min-h-full w-[300px] pt-[20px] flex flex-col pl-[20px]  px-[10px] bg-white">
            <div className="flex flex-row border-b-gray-200 border-b-[1px]">
              <Link
                className="text-[15px] font-medium"
                onClick={toggleenglishNavigation}
                href="/english"
              >
                Go to all English
              </Link>
            </div>
            <div className="flex flex-row border-b-gray-200 font-medium mt-[20px] border-b-[1px]">
              <Link
                onClick={toggleenglishNavigation}
                href="/maths/trigonometry/theory"
              >
                Trigonometry
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[10px] ">
              <Link
                onClick={toggleenglishNavigation}
                href="/maths/trigonometry/theory"
              >
                ・Theory
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[8px] ">
              <Link
                onClick={toggleenglishNavigation}
                href="/maths/trigonometry/practice"
              >
                ・Practice
              </Link>
            </div>
          </div>
        )}
        <div className="min-h-full w-[50px] flex justify-center text-[rgba(0,0,0,0.5)] pt-[20px]  bg-white border-r-[1px] border-r-gray-300">
          <PanelLeft
            onClick={toggleenglishNavigation}
            className="w-[20px] cursor-pointer"
          ></PanelLeft>
        </div>
      </div>
    </main>
  );
}

export default NavigationPanel;
