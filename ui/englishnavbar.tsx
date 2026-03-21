"use client";
import Link from "next/link";
import useContactStore from "@/store/states";
import { PanelLeft, ArrowBigLeft } from "lucide-react";
function NavigationPanel() {
  const { englishnavigationState, toggleenglishNavigation } = useContactStore();

  return (
    <main className=" z-20 h-full bg-none">
      <div className="flex flex-row absolute h-full">
        {englishnavigationState && (
          <div className="min-h-full border-r-[1px] sm:border-r-[0px] border-gray-300 w-[260px] pt-[20px] flex flex-col  md:pl-[20px]   px-[10px] bg-white">
            <div className="flex flex-row border-b-gray-200 border-b-[1px]">
              <Link
                className="ord-text font-medium"
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
                className="ord-text"
              >
                Кружок английского &apos; Шэкспир&apos;
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[10px] ">
              <Link
                onClick={toggleenglishNavigation}
                href="/english/shakespeare/about/"
                className="ord-text"
              >
                ・О кружке
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[8px] ">
              <Link
                onClick={toggleenglishNavigation}
                className="ord-text"
                href="/english/shakespeare/plan/"
              >
                ・План занятий
              </Link>
            </div>
            <div className="flex flex-row border-b-gray-200 font-medium mt-[20px] border-b-[1px]">
              <Link
                onClick={toggleenglishNavigation}
                href="/english/A2/"
                className="ord-text"
              >
                Уровень английского A1-A2
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[10px] ">
              <Link
                onClick={toggleenglishNavigation}
                className="ord-text"
                href="/english/A2/people"
              >
                ・Занятие 1 - People
              </Link>
            </div>
            <div className="flex flex-row ml-[10px]  mt-[8px] ">
              <Link
                onClick={toggleenglishNavigation}
                className="ord-text"
                href=""
              >
                ・Занятие 2 - Routines
              </Link>
            </div>
          </div>
        )}
        <div className=" z-67  w-[50px] h-[60px] bg-purple-200 sm:bg-white sm:min-h-full border-b-[1px] border-b-gray-300 flex justify-end pr-[20px]  pt-[15px]   border-r-[1px] border-r-gray-300">
          <PanelLeft
            onClick={toggleenglishNavigation}
            className=" w-[15px] text-purple-500 cursor-pointer"
          ></PanelLeft>
        </div>
      </div>
    </main>
  );
}

export default NavigationPanel;
