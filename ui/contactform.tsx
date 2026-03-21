"use client";
import useContactStore from "@/store/states";
import { X } from "lucide-react";

function Contactform() {
  const { contactState, toggleContact, closeEverything } = useContactStore();

  return (
    <main>
      {contactState && (
        <div className="w-full z-23 absolute h-full backdrop-blur-xs  flex justify-center  flex-1">
          <div className="bg-orange-400 relative w-[320px] h-[320px] ord-text text-white rounded-xl flex flex-col mt-[50px] md:mt-[100px] p-[20px]">
            <div className="w-full flex justify-end text-white">
              <X className="cursor-pointer" onClick={toggleContact}></X>
            </div>
            <div className="flex flex-row">
              <img
                src="/me"
                className=" outline-white outline-[1px] w-[150px] h-[150px] rounded-full"
              />
              <p className="ord-text text-white font-semibold mt-[30px] w-[150px] ml-[10px]">
                Привет, я разработчик этого вебсайта!
              </p>
            </div>
            <p className="w-[240px]">
              Буду рада услышать критику и предложения по поводу вебсайта!
            </p>
            <a href="https://" target="_blank">
              Мой вк: https:
            </a>
            <a href="https://" target="_blank">
              Мой тг: https:
            </a>
            <img
              src="/hi.png"
              className=" absolute bottom-0 mb-[-40px] mr-[-30px] right-0 w-[130px]"
            />
          </div>{" "}
        </div>
      )}
    </main>
  );
}

export default Contactform;
