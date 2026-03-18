"use client";
import useContactStore from "@/store/states";
import { LogIn } from "lucide-react";
function Contactform() {
  const { registerState, toggleRegister } = useContactStore();

  return (
    <div className="cursor-pointer" onClick={toggleRegister}>
      <LogIn className="     text-gray-800 ml-[20px] w-[20px]" />
    </div>
  );
}

export default Contactform;
