import {
  ArrowLeft,
  BookOpenText,
  Check,
  BookMarked,
  BookText,
  Speech,
} from "lucide-react";
import Link from "next/link";
function page() {
  return (
    <main>
      <div className="flex flex-row items-center justify-between">
        <Link href="/english/A1">
          {" "}
          <ArrowLeft className="text-gray-600"></ArrowLeft>
        </Link>
        <div className="bg-purple-300 flex items-center justify-center w-[180px] h-[50px] rounded-full text-[20px] font-semibold">
          {" "}
          A1: People
        </div>
      </div>
      <Link
        href="/english/A1/people/grammar"
        className="flex flex-row hover:translate-y-[-10px] transition:all hover:shadow-md transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[50px]"
      >
        <div className="flex flex-row items-center justify-between">
          <BookOpenText className="w-[65px] h-[65px] text-purple-500"></BookOpenText>
          <div className="flex  ml-[30px] flex-col">
            <div className=" font-semibold">Grammar</div>
            <div className=" text-gray-500 font-semibold ">
              Present Simple vs Present Continuous, stative verbs
            </div>
          </div>
        </div>
        <div className=" bg-purple-100 w-[45px] h-[45px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="w-[35px] h-[35px]"></Check>
        </div>
      </Link>
      <Link
        href="/english/A1/people/vocab"
        className="flex flex-row hover:translate-y-[-10px] transition:all hover:shadow-md transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[-10px]"
      >
        <div className="flex flex-row items-center justify-between">
          <BookMarked className="w-[65px] h-[65px] text-purple-500"></BookMarked>
          <div className="flex  ml-[30px] flex-col">
            <div className=" font-semibold">Vocabulary</div>
            <div className=" text-gray-500 font-semibold ">
              Character (friendly, shy, confidient), appearance, emotions and
              feelings
            </div>
          </div>
        </div>
        <div className=" bg-purple-100 w-[45px] h-[45px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="w-[35px] h-[35px]"></Check>
        </div>
      </Link>
      <Link
        href="/english/A1/people/reading"
        className="flex flex-row hover:translate-y-[-10px] transition:all hover:shadow-md transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[-10px]"
      >
        <div className="flex flex-row items-center justify-between">
          <BookText className="w-[65px] h-[65px] text-purple-500"></BookText>
          <div className="flex  ml-[30px] flex-col">
            <div className=" font-semibold">Reading</div>
            <div className=" text-gray-500 font-semibold ">
              Mao talks about herself and her friends
            </div>
          </div>
        </div>
        <div className=" bg-purple-100 w-[45px] h-[45px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="w-[35px] h-[35px]"></Check>
        </div>
      </Link>
      <Link
        href="/english/A1/people/ai"
        className="flex flex-row hover:translate-y-[-10px] relative transition:all hover:shadow-md  transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[-10px] z-5"
      >
        <img
          src="/aiclose.png"
          className=" absolute left-0 ml-[30px] w-[160px] h-[160px]"
        />
        <div className="flex flex-row ml-[70px] items-center justify-between">
          <Speech className="w-[65px] h-[65px] opacity-0 text-purple-500"></Speech>
          <div className="flex  ml-[30px] flex-col">
            <div className=" font-semibold">Speaking</div>
            <div className=" text-gray-500 font-semibold ">
              Tell Mao about yourself!
            </div>
          </div>
        </div>

        <div className=" bg-purple-100 w-[45px] h-[45px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="w-[35px] h-[35px]"></Check>
        </div>
      </Link>
    </main>
  );
}

export default page;
