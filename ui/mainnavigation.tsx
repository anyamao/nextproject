"use client";
import useContactStore from "@/store/states";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
function Navigation() {
  const { navigationState, toggleNavigation } = useContactStore();
  return (
    <main>
      <div
        className="cursor-pointer bg-gray-900  items-center justify-center font-semibold flex flex-row items-center px-[14px]  py-[6px] sm:ml-[20px] rounded-full text-white"
        onClick={toggleNavigation}
      >
        <Menu className=" w-[17px] text-gray-400 " />
        <p className="ml-[10px] smaller-text">Меню </p>
      </div>
    </main>
  );
}

export default Navigation;
