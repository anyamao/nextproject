import Mainnav from "./../ui/mainnav";
import ContactForm from "./../ui/contactform";
import RegisterForm from "./../ui/registerform";
import NavigationPanel from "./../ui/navigationpanel";

export default async function Home() {
  return (
    <div className="flex-1 flex flex-col items-center px-[10px] sm:px-[0px] py-[50px]  min-w-full min-h-full relative bg-gray-100 ">
      <div className="text-wrap  flex flex-col  ">
        <div className="flex justify-center h-min w-full  border-b-[3px] border-b-teal-500 ">
          <div className="relative">
            <p className="ord-text sm:bigger-text font-semibold bg-orange-300 rounded-full max-w-[300px] rounded-br-none sm:p-[20px] p-[10px] ">
              Бесплатные материалы по английскому, математике и другим
              предметам!
            </p>
          </div>
          <img
            src="/people.png"
            className="  w-[110px] h-[110px] md:w-[300px] md:h-[300px]"
          />
        </div>
      </div>
      <div className="text-wrap flex  flex-col">
        <p className="bigger-text font-semibold"> Рекомендую</p>
        <p className="ord-text">
          Чтобы учить английский перейдите в &apos;Бесплатные материалы&apos;,
          там уже доступен урок и тест к нему. Чтобы учиться математике нажмите
          &apos;Математика&apos; и выберите интересующую тему. Чтобы записаться
          на очный кружок нажмите на &apos;Кружок английского
          &apos;Шэкспир&apos;
        </p>
      </div>
      <div className="text-wrap  h-[320px] sm:h-[280px] mb-[50px]  flex flex-col">
        <p className="font-semibold ">
          В будущем также планируется реализовать данные функции:
        </p>
        <div className="flex flex-row mt-[10px] ord-text relative">
          <div className="rounded-full absolute smaller-text w-[40px] h-[40px] bg-yellow-500">
            {" "}
          </div>{" "}
          <p className="absolute sm:mt-[5px] ml-[35px]">
            ИИ-собеседник для лучшей практики говорения на иностранном языке
          </p>
        </div>
        <div className="flex flex-row relative ord-text mt-[60px] sm:mt-[45px]  ml-[10px]">
          <div className="rounded-full absolute w-[45px] h-[45px] bg-purple-400">
            {" "}
          </div>{" "}
          <p className="absolute ml-[35px] mt-[10px]">
            Своя программа для сдачи больших тестов
          </p>
        </div>
        <div className="flex flex-row relative ord-text mt-[60px] sm:mt-[50px]  ml-[3px]">
          <div className="rounded-full absolute w-[36px] h-[36px] bg-blue-400">
            {" "}
          </div>{" "}
          <p className="absolute ml-[35px]">
            Кружок по программированию, фокус на DevOps и Web-development
          </p>
        </div>
        <div className="flex flex-row relative ord-text mt-[60px] sm:mt-[50px]  ml-[3px]">
          <div className="rounded-full absolute w-[40px] h-[40px] bg-orange-400"></div>{" "}
          <p className="absolute ml-[35px] sm:mt-[5px]">
            Курс подготовки к ЕГЭ по профильной математике
          </p>
        </div>
      </div>
    </div>
  );
}
