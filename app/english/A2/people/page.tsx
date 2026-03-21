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
    <main className=" flex-1 flex   flex-col items-center px-[10px] sm:px-[0px] py-[30px]  w-full h-full relative ">
      <div className="flex flex-row text-wrap-no items-center    justify-between">
        <Link href="/english/A2">
          {" "}
          <ArrowLeft></ArrowLeft>
        </Link>
        <div className="bg-purple-300 flex font-semobild ord-text items-center justify-center w-[110px] h-[40px] rounded-full ord-text font-semibold">
          A2:People
        </div>
      </div>

      <Link
        href="/english/A2/people/grammar"
        className="flex flex-row hover:translate-y-[-10px]  transition:all hover:shadow-md transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[0px]"
      >
        <div className="flex flex-row items-center h-[70px]   justify-between">
          <BookOpenText className=" ml-[10px] w-[40px] h-[40px] text-purple-500"></BookOpenText>
          <div className="flex  ml-[20px] flex-col">
            <div className=" font-semibold ord-text">Grammar</div>
            <div className=" text-gray-500   smaller-text sm:ord-text font-semibold ">
              Present Simple vs Present Continuous, stative verbs
            </div>
          </div>
        </div>
        <div className=" bg-purple-100 w-[30px] h-[30px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="w-[30px] h-[20px] "></Check>
        </div>
      </Link>
      <Link
        href="/english/A2/people"
        className="flex flex-row hover:translate-y-[-10px]  transition:all hover:shadow-md transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[0px]"
      >
        <div className="flex flex-row items-center h-[70px]   justify-between">
          <BookMarked className=" ml-[10px] w-[40px] h-[40px] text-purple-500"></BookMarked>
          <div className="flex  ml-[20px] flex-col">
            <div className=" font-semibold ord-text">Vocabulary</div>
            <div className=" text-gray-500   smaller-text sm:ord-text font-semibold ">
              Describe a person. Character traits.
            </div>
          </div>
        </div>
        <div className=" bg-purple-100 w-[30px] h-[30px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="w-[30px] h-[20px] "></Check>
        </div>
      </Link>
      <Link
        href="/english/A2/people"
        className="flex flex-row hover:translate-y-[-10px]  transition:all hover:shadow-md transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[0px]"
      >
        <div className="flex flex-row items-center h-[70px]   justify-between">
          <BookText className=" ml-[10px] w-[40px] h-[40px] text-purple-500"></BookText>
          <div className="flex  ml-[20px] flex-col">
            <div className=" font-semibold ord-text">Reading</div>
            <div className=" text-gray-500   smaller-text sm:ord-text font-semibold ">
              Mao talks about herself and her friends.
            </div>
          </div>
        </div>
        <div className=" bg-purple-100 w-[30px] h-[30px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className="w-[30px] h-[20px] "></Check>
        </div>
      </Link>

      <Link
        href="/english/A2/people"
        className="flex flex-row hover:translate-y-[-10px] relative transition:all hover:shadow-md  transition-transform duration-300 text-wrap cursor-pointer transition-all  items-center justify-between mt-[-20px] z-5"
      >
        <img
          src="/aiclose.png"
          className=" absolute left-0 ml-[20px] w-[80px] h-[80px] "
        />
        <div className="flex flex-row  h-[70px] ml-[10px] items-center justify-between">
          <Speech className="w-[65px] h-[65px] opacity-0 text-purple-500"></Speech>
          <div className="flex  ml-[30px] flex-col">
            <div className=" font-semibold ord-text">Speaking</div>
            <div className=" text-gray-500 sm:ord-text  smaller-text font-semibold ">
              Tell Mao about yourself!
            </div>
          </div>
        </div>

        <div className=" bg-purple-100  w-[30px] h-[30px] flex items-center justify-center text-purple-500 rounded-full ">
          <Check className=" w-[20px] h-[20px] "></Check>
        </div>
      </Link>
    </main>
  );
}

export default page;
