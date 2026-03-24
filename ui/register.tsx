"use client";
import useContactStore from "@/store/states";
import { LogIn, ArrowDown } from "lucide-react";
import Link from "next/link";
function Contactform() {
  const { registerState, toggleRegister, isAuthenticated } = useContactStore();

  return (
    <div className="cursor-pointer">
      {!isAuthenticated && (
        <LogIn
          onClick={toggleRegister}
          className="     text-gray-700  w-[20px] "
        />
      )}
      {isAuthenticated && <img src="/me" className="w-[35px] rounded-full" />}
    </div>
  );
}

export default Contactform;
