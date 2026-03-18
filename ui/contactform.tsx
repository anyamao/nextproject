"use client";
import useContactStore from "@/store/states";
import { X } from "lucide-react";

function Contactform() {
  const { contactState, toggleContact } = useContactStore();

  return (
    <main>
      {contactState && (
        <div className="min-w-screen z-23 absolute min-h-full backdrop-blur-xs bg-white/30 flex justify-center flex-1">
          <div className=" relative w-[600px] mt-[15%] h-[600px]">
            <div className="text-white w-[500px] flex flex-col p-[40px] h-[460px] bg-orange-400 rounded-lg shadow-lg font-semibold">
              <div className="w-full relative  h-[30px]">
                <X
                  onClick={toggleContact}
                  className="absolute right-0 cursor-pointer  mr-[-20px] mt-[-20px] top-0"
                ></X>
              </div>

              <p className="text-[40px] mt-[-30px]">Привет! (´꒳`)♡</p>
              <p className="text-[23px] ">
                Меня зовут Вероника, я разработчик этого вебсайта
              </p>
              <div className="flex flex-row">
                <img
                  src="/Telegram Desktop/me"
                  className=" rounded-full w-[150px] mt-[10px] outline-[3px] outline-white"
                />
                <p className="w-[160px] mt-[10px] ml-[10px]">
                  {" "}
                  Я буду рада услышать критику и предложения. По всем вопросам
                  можете писать мне в телеграм
                </p>
              </div>
              <a
                href="https://telegram.me/anyamaoo"
                className="mt-[10px] text-[23px]"
              >
                Мой телеграм: anyamaoo
              </a>
            </div>
            <img
              src="/Telegram Desktop/hi.png"
              className=" absolute bottom-0 right-0 w-[250px]"
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default Contactform;
