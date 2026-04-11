import useContactStore from "@/store/states";
import Link from "next/link";
import { X, MessageCirclePlus } from "lucide-react";
export default function AI() {
  const { aispaceState, toggleAiSpace } = useContactStore();

  return (
    <div className="">
      <div
        onClick={toggleAiSpace}
        className={` ${!aispaceState ? "hidden" : ""}  fixed bottom-0 right-0 shadow-xs cursor-pointer hover:mb-[55px] transiton-all duration-300 bg-white mb-[50px] mr-[10px] flex items-center justify-center rounded-[20px] py-[7px] px-[5px] z-50`}
      >
        <div className="h-[60px] w-[4px] bg-orange-200 ml-[7px]"></div>
        <div className="flex flex-col">
          <p className="smaller-text font-semibold flex text-right pr-[10px] ml-[10px] ">
            ИИ-учитель Мао
          </p>
          <p className="smaller-text font-semibold text-gray-600 flex text-right pr-[10px] ml-[10px] ">
            Помогу со всем!
          </p>
        </div>
        <img
          src="/aiclose.png"
          className="rounded-full max-w-[80px] border-orange-400  border-[1px] max-h-80px]"
        />
      </div>
      <div
        className={`  ${aispaceState ? "hidden" : ""}  pt-[140px] p-[20px] w-[50%] h-full bg-white fixed z-20`}
      >
        <div className="flex flex-row items-center justify-between border-b-[1px] border-b-gray-200 pb-[10px]">
          <div className="flex items-center">
            <img
              src="/aiclose.png"
              className="rounded-full max-w-[50px] max-h-[50px]"
            />
            <MessageCirclePlus className="w-[25px] pointer ml-[15px] h-[25px] ml-[3px] text-gray-500" />

            <Link
              href="/tutor"
              className="bg-purple-500 ml-[20px] px-[10px] py-[3px] rounded-md"
            >
              <p className="smaller-text font-semibold text-white">
                {" "}
                Полная версия
              </p>
            </Link>
          </div>
          <p className="font-semibold ord-text ml-[-40px]">Мао - ИИ-учитель</p>
          <X
            className="w-[20px] h-[20px] pointer hover:text-gray-400 transition-all duration-300 text-gray-500 "
            onClick={toggleAiSpace}
          />
        </div>
      </div>
    </div>
  );
}
