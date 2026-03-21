"use client";
import useContactStore from "@/store/states";
import { LogIn } from "lucide-react";
function Contactform() {
  return (
    <div className="cursor-pointer">
      <LogIn className="     text-gray-800 ml-[20px] w-[15px] md:w-[20px]" />
    </div>
  );
}

export default Contactform;
