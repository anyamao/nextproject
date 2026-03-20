import Link from "next/link";
import { ArrowLeft } from "lucide-react";
function page() {
  return (
    <main>
      <div className="p-[50px] ">
        <div className="flex flex-row mt-[-50px] items-center justify-between">
          <Link href="/english">
            {" "}
            <ArrowLeft></ArrowLeft>
          </Link>
          <div className="bg-purple-300 flex font-semobild text-[30px] items-center justify-center w-[60px] h-[60px] rounded-full text-[20px] font-semibold">
            A2
          </div>
        </div>

        <div className="flex flex-col mt-[30px] items-center">
          <Link
            href="/english/A2/people"
            className=" w-[180px] transition-all duration-300 flex items-center hover:scale-105 justify-center rounded-full h-[180px] outline-purple-200 outline-[8px] border-[5px] border-white bg-purple-500"
          >
            <img src="/cover3.png" className="w-[150px]  h-[150px]" />{" "}
          </Link>
          <div className="bg-purple-200 mt-[10px] h-[35px] rotate-7 flex items-center justify-center w-[130px]">
            <Link href="/english/A1/people" className="rotate-353">
              People
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-center mt-[50px]">
          <div className=" w-[180px] transtion-all duration-300 hover:scale-105 rounded-full flex items-center justify-center  h-[180px] outline-blue-200 outline-[8px] border-[5px] border-white bg-blue-500">
            <img
              src="/englishclose.png"
              className="w-[200px] mb-[10px] rounded-full h-[180px]"
            />{" "}
          </div>
          <div className="bg-blue-200 mt-[10px] h-[35px] rotate-355 flex items-center justify-center w-[140px]">
            <p className="rotate-5">Routines</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default page;
