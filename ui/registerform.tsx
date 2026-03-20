"use client";
import { X } from "lucide-react";
import useContactStore from "@/store/states";
function Registerform() {
  const { registerState, toggleRegister } = useContactStore();

  return (
    <main>
      {registerState && (
        <div className=" min-w-full absolute z-22  min-h-full  backdrop-blur-xs bg-white/30  flex justify-center flex-1">
          <div className="bg-white  relative shadow-lg rounded-[10px] p-[20px] w-[500px] flex flex-col items-center mt-[15%] h-[600px]">
            <X
              onClick={toggleRegister}
              className="absolute right-0 cursor-pointer  mr-[30px] mt-[30px] top-0"
            ></X>

            <p className="font-semibold mt-[50px] text-[25px]">
              Регистрация в процессе :){" "}
            </p>
            <img src="/laughingclose.png" className="w-[300px] h-[300px]" />
          </div>
        </div>
      )}
    </main>
  );
}

export default Registerform;
