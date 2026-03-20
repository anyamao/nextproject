"use client";
import Link from "next/link";
import useContactStore from "@/store/states";
import { PanelLeft, ArrowBigLeft } from "lucide-react";
function NavigationPanel() {
  const { mathnavigationState, togglemathNavigation } = useContactStore();

  return (
    <main>
      <div className="flex flex-row absolute min-h-full">
        {mathnavigationState && (
          <div className="min-h-full w-[300px] pt-[20px] flex flex-col pl-[20px]  px-[10px] bg-white">
            <div className="flex flex-row border-b-gray-200 border-b-[1px]">
              <Link
                className="text-[15px] font-medium"
                onClick={togglemathNavigation}
                href="/maths"
              >
                Ко всей математике
              </Link>
            </div>
            <div className="flex flex-row border-b-gray-200 font-medium mt-[20px] border-b-[1px]">
              <Link
                onClick={togglemathNavigation}
                href="/maths/trigonometry/theory"
              >
                Тригонометрия
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[10px] ">
              <Link
                onClick={togglemathNavigation}
                href="/maths/trigonometry/theory"
              >
                ・Теория
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[8px] ">
              <Link
                onClick={togglemathNavigation}
                href="/maths/trigonometry/practice"
              >
                ・Практика
              </Link>
            </div>
          </div>
        )}
        <div className="min-h-full w-[50px] flex justify-center text-[rgba(0,0,0,0.5)] pt-[20px]  bg-white border-r-[1px] border-r-gray-300">
          <PanelLeft
            onClick={togglemathNavigation}
            className="w-[20px] cursor-pointer"
          ></PanelLeft>
        </div>
      </div>
    </main>
  );
}

export default NavigationPanel;
