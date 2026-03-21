"use client";
import useContactStore from "@/store/states";
import { X } from "lucide-react";

function Contactform() {
  const { contactState, toggleContact, closeEverything } = useContactStore();

  return (
    <main>
      {contactState && (
        <div className="w-full z-23 absolute h-full backdrop-blur-md  flex justify-center  flex-1">
          <div className=" relative md:w-[600px] w-[400px] mt-[200px] ml-[50px] h-[600px]">
            <div className="text-white md:w-[500px] w-[350px] pl-[25px] flex flex-col  md:h-[460px] h-[360px] bg-orange-400 rounded-lg shadow-lg font-semibold">
              <div className="w-full relative h-[30px]">
                <X
                  onClick={toggleContact}
                  className="absolute right-0 cursor-pointer  mr-[30px] mt-[30px] top-0"
                ></X>
              </div>
              <img
                src="/me"
                className="md:w-[200px] md:h-[200px] w-[150px] h-[150px] mt-[10px] rounded-full outline-1 outline-white"
              />
              <p className="md:text-[40px] text-[20px] md:mt-[-150px] mt-[-100px] ml-[220px]">
                Hi! (´꒳`)♡
              </p>

              <p className="mt-[100px] text-[12px] md:text-[20px]">
                {" "}
                Я разработчик этого вебсайта, <br></br> рада критике и
                сотрудничеству!
              </p>
              <a className=" md:text-[20px] text-[12px] mt-[10px] border-t-[3px] border-t-orange-500">
                Напишите мне в tg: anyamaoo
              </a>
              <a
                className="md:text-[20px] text-[12px]"
                target="_blank"
                href="https://vk.com/anyamaoo"
              >
                {" "}
                Напишите мне в vk: <br></br> https://vk.com/anyamaoo
              </a>
            </div>
            <img
              src="/hi.png"
              className=" absolute bottom-0 right-0 mr-[-10px] mb-[100px] md:mb-[0px] md:w-[250px] w-[180px]"
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default Contactform;
