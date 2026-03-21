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
    <main className="max-w-[500px] flex flex-col ml-[20px]">
      <div className="flex flex-row items-center justify-between">
        <Link href="/english/A2">
          {" "}
          <ArrowLeft className="text-gray-600"></ArrowLeft>
        </Link>
        <div className="bg-purple-300 flex items-center justify-center mr-[40px] md:w-[180px] h-[40px] w-[110px] rounded-full md:text-[20px] text-[12px] font-semibold">
          {" "}
          A2: People
        </div>
      </div>
      <Link
        href="/english/A2/people/grammar"
        className="flex flex-row hover:translate-y-[-10px] transition:all hover:shadow-md transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[50px]"
      >
        <div className="flex flex-row items-center h-[70px] justify-between">
          <BookOpenText className=" ml-[10px] md:w-[65px] md:h-[65px] w-[30px] h-[30px] text-purple-500"></BookOpenText>
          <div className="flex  ml-[30px] flex-col">
            <div className=" font-semibold">Grammar</div>
            <div className=" text-gray-500  text-[12px] md:text-[15px] font-semibold ">
              Present Simple vs Present Continuous, stative verbs
            </div>
          </div>
        </div>
        <div className=" bg-purple-100 md:w-[45px] md:h-[45px] w-[30px] h-[30px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="md:w-[35px] md:h-[35px] w-[20px] h-[20px] "></Check>
        </div>
      </Link>
      <Link
        href="/english/A2/people"
        className="flex flex-row hover:translate-y-[-10px] transition:all hover:shadow-md transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[-10px]"
      >
        <div className="flex flex-row items-center h-[70px] justify-between">
          <BookMarked className="  ml-[10px] md:w-[65px] md:h-[65px] w-[30px] h-[30px] text-purple-500"></BookMarked>
          <div className="flex  ml-[30px] flex-col">
            <div className=" font-semibold">Vocabulary</div>
            <div className=" text-gray-500 text-[12px] md:text-[15px] font-semibold ">
              Character (friendly, shy, confidient), appearance, emotions and
              feelings
            </div>
          </div>
        </div>
        <div className=" bg-purple-100 md:w-[45px] md:h-[45px] w-[30px] h-[30px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="md:w-[35px] md:h-[35px] w-[20px] h-[20px] "></Check>
        </div>
      </Link>
      <Link
        href="/english/A2/people"
        className="flex flex-row hover:translate-y-[-10px] transition:all hover:shadow-md transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[-10px]"
      >
        <div className="flex flex-row items-center h-[70px] justify-between">
          <BookText className="      ml-[10px] md:w-[65px] md:h-[65px] w-[30px] h-[30px]      text-purple-500"></BookText>
          <div className="flex  ml-[30px] flex-col">
            <div className=" font-semibold">Reading</div>
            <div className=" text-gray-500 md:text-[15px] text-[12px] font-semibold ">
              Mao talks about herself and her friends
            </div>
          </div>
        </div>
        <div className=" bg-purple-100 md:w-[45px] md:h-[45px] w-[30px] h-[30px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="md:w-[35px] md:h-[35px] w-[20px] h-[20px] "></Check>
        </div>
      </Link>
      <Link
        href="/english/A2/people"
        className="flex flex-row hover:translate-y-[-10px] relative transition:all hover:shadow-md  transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[-10px] z-5"
      >
        <img
          src="/aiclose.png"
          className=" absolute left-0 ml-[30px] w-[60px] h-[60px] md:w-[160px] md:h-[160px]"
        />
        <div className="flex flex-row md:ml-[70px] h-[70px] ml-[30px] items-center justify-between">
          <Speech className="w-[65px] h-[65px] opacity-0 text-purple-500"></Speech>
          <div className="flex  ml-[30px] flex-col">
            <div className=" font-semibold">Speaking</div>
            <div className=" text-gray-500 text-[12px] md:text-[15px] font-semibold ">
              Tell Mao about yourself!
            </div>
          </div>
        </div>

        <div className=" bg-purple-100 md:w-[45px] md:h-[45px] w-[30px] h-[30px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="md:w-[35px] md:h-[35px] w-[20px] h-[20px] "></Check>
        </div>
      </Link>
    </main>
  );
}

export default page;
