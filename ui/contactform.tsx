"use client";
import useContactStore from "@/store/states";
import { X } from "lucide-react";

function Contactform() {
  const { contactState, toggleContact } = useContactStore();

  return (
    <main>
      {contactState && (
        <div className="w-full z-23 absolute h-full backdrop-blur-xs  flex justify-center  flex-1">
          <div className=" relative w-[600px] mt-[200px] ml-[50px] h-[600px]">
            <div className="text-white w-[500px] pl-[25px] flex flex-col  h-[460px] bg-orange-400 rounded-lg shadow-lg font-semibold">
              <div className="w-full relative h-[30px]">
                <X
                  onClick={toggleContact}
                  className="absolute right-0 cursor-pointer  mr-[30px] mt-[30px] top-0"
                ></X>
              </div>
              <img
                src="/Telegram Desktop/me"
                className="w-[200px] h-[200px] mt-[10px] rounded-full outline-1 outline-white"
              />
              <p className="text-[40px] mt-[-150px] ml-[160px]">
                Привет! (´꒳`)♡
              </p>
            </div>
            <img
              src="/Telegram Desktop/hi.png"
              className=" absolute bottom-0 right-0 mr-[-10px] w-[250px]"
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default Contactform;
