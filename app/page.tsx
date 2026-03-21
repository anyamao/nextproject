import Mainnav from "./../ui/mainnav";
import ContactForm from "./../ui/contactform";
import RegisterForm from "./../ui/registerform";
import NavigationPanel from "./../ui/navigationpanel";

export default async function Home() {
  return (
    <div className="flex-1 flex justify-center  min-w-full min-h-full relative bg-gray-100 ">
      <div className="text-wrap  mt-[40px] md:h-[700px] h-[880px] flex flex-col text-[20px]  md:text-[30px] font-semibold w-[70%]">
        <p>Бесплатные уроки по английскому, математике и другим предметам!</p>
        <p className="font-normal text-[15px] md:text-[20px]">
          Перейдите в &apos;Бесплатные материалы&apos;, там есть бесплатный урок
          по английскому и тест к нему, чтобы проверить знания
        </p>

        <p className="bg-purple-200 text-[15px] md:text-[20px] mt-[20px]">
          {" "}
          В планах реализовать:{" "}
        </p>
        <p className=" text-[15px] md:text-[20px] mt-[20px]">
          • Свою систему для прохождения тестов <br></br>• Собеседник-ИИ для
          практики разговора на иностранном языке <br></br>• Систему страйка и
          достижений за успехи в учебе <br></br>• Курс по программированию
        </p>
        <img
          src="/people.png"
          className=" md:ml-[60%]   w-[150px] h-[150px] md:w-[250px] md:h-[250px]"
        />
      </div>
    </div>
  );
}
