"use client";
import Link from "next/link";
import useContactStore from "@/store/states";
import { PanelLeft, ArrowBigLeft } from "lucide-react";
function NavigationPanel() {
  const { englishnavigationState, toggleenglishNavigation } = useContactStore();

  return (
    <main>
      <div className="flex flex-row absolute  z-10 min-h-full">
        {englishnavigationState && (
          <div className="min-h-full w-[300px] pt-[20px] flex flex-col md:pl-[20px]   px-[10px] bg-white">
            <div className="flex flex-row border-b-gray-200 border-b-[1px]">
              <Link
                className="text-[15px] font-medium"
                onClick={toggleenglishNavigation}
                href="/english"
              >
                Ко всему английскому
              </Link>
            </div>
            <div className="flex flex-row border-b-gray-200 font-medium mt-[20px] border-b-[1px]">
              <Link
                onClick={toggleenglishNavigation}
                href="/english/shakespeare/about/"
              >
                Кружок английского &apos; Шэкспир&apos;
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[10px] ">
              <Link
                onClick={toggleenglishNavigation}
                href="/english/shakespeare/about/"
              >
                ・О кружке
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[8px] ">
              <Link
                onClick={toggleenglishNavigation}
                href="/english/shakespeare/plan/"
              >
                ・План занятий
              </Link>
            </div>
            <div className="flex flex-row border-b-gray-200 font-medium mt-[20px] border-b-[1px]">
              <Link onClick={toggleenglishNavigation} href="/english/A2/">
                Уровень английского A1-A2
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[10px] ">
              <Link onClick={toggleenglishNavigation} href="/english/A2/people">
                ・Занятие 1 - People
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[8px] ">
              <Link onClick={toggleenglishNavigation} href="">
                ・Занятие 2 - Routines
              </Link>
            </div>
          </div>
        )}
        <div className="min-h-full z-67   md:w-[50px] w-[20px] flex justify-end pr-[20px] text-[rgba(0,0,0,0.5)] pt-[20px]  bg-white border-r-[1px] border-r-gray-300">
          <PanelLeft
            onClick={toggleenglishNavigation}
            className="md:w-[30px] w-[15px] text-purple-500 cursor-pointer"
          ></PanelLeft>
        </div>
      </div>
    </main>
  );
}

export default NavigationPanel;
