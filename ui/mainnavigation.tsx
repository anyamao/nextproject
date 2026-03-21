"use client";
import useContactStore from "@/store/states";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
function Navigation() {
  const { navigationState, toggleNavigation } = useContactStore();
  return (
    <main>
      <div
        className="cursor-pointer bg-gray-900 text-[12px]   items-center justify-center font-semibold flex flex-row items-center px-[15px] py-[8px] rounded-full text-white"
        onClick={toggleNavigation}
      >
        <Menu className="w-[20px]" />
        <p className="ml-[10px]">Меню </p>
      </div>
    </main>
  );
}

export default Navigation;
