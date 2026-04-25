"use client";
import useContactStore from "@/store/states";
import { LogIn, ArrowDown } from "lucide-react";
import Link from "next/link";
function Contactform() {
  const {
    registerState,
    toggleRegister,
    isAuthenticated,
    profilenavigationState,
    toggleprofilenavigation,
  } = useContactStore();

  return (
    <div className="cursor-pointer">
      {!isAuthenticated && (
        <LogIn
          onClick={toggleRegister}
          className="     text-gray-700  w-[20px] "
        />
      )}
      {isAuthenticated && (
        <img
          src="/aiclose.png"
          className="w-[35px] rounded-full"
          onClick={toggleprofilenavigation}
        />
      )}
    </div>
  );
}

export default Contactform;
