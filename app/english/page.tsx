function page() {
  return (
    <main>
      <div className="text-wrap">
        <p className="text-[25px] bg-blue-300 font-semibold">
          Let&apos;s learn English together!
        </p>

        <div className="flex flex-row mt-[20px] border-b-[1px] border-b-gray-200 items-top justify-between">
          <div className="flex flex-col items-center md:items-start">
            {" "}
            <p className=" text-[17px]">
              Клуб английского языка{" "}
              <span className="font-semibold"> &apos;Shakespeare&apos; </span>{" "}
              (Шэкспир), изучение английского через погружение в историю и
              литературу.
            </p>
            <p className="font-semibold text-[17px] mt-[10px]">
              {" "}
              Как будет происходить обучение?
            </p>
            <p className="text-[17px]">
              1) Выбираем книгу на английском и вместе читаем её по главам
            </p>
            <p className="text-[17px]">
              2) Обсуждаем прочитанное на английском на каждом занятии
            </p>
            <p className="text-[17px]">
              3) Находим интересные слова и конструкции, делаем учебный материал
            </p>
            <p className="text-[17px]">
              4) Каждый пишет рецензию на эту книгу на английском, обсуждаем
              работы друг друга
            </p>
            <p className="text-[17px] mt-[10px] font-semibold">
              {" "}
              Для тех, кто хочет серьёзно повышать уровень/ готовиться к
              экзаменам:{" "}
            </p>
            <p> Каждую неделю будем разбирать вариант IELTS </p>
            <p>
              Будем проходить учебные материалы, нужные для повышения уровня
            </p>
            <p className="border-t-[1px] font-semibold mt-[10px] py-[10px] border-t-gray-300">
              Будет весело, интересно и полезно для всех уровней английского и
              всех возрастов! Вы точно узнаете много нового и получите уйму
              практики, особенно такую ценную практику свободного говорения на
              английском. Записывайтесь! ;)
            </p>
            <a
              href="https://forms.gle/84kxA4BLtDyXyUKdA"
              target="_blank"
              className="bg-red-600 mt-[10px] mb-[20px] cursor-pointer text-white font-semibold text-[20px] flex items-center justify-center rounded-full shadow-md hover:w-[290px] duration-300 transition-all w-[270px] h-[80px]"
            >
              Записаться
            </a>
            <p className="mb-[10px]">
              По всем вопросам можете писать мне, чтобы сделать это нажмите на
              оранжевую кнопку &apos;Написать&apos; сверху справа.{" "}
            </p>
          </div>
          <img
            src="/englishout.png"
            className=" hidden md:block  mt-[-50px] mr-[-20px] w-[300px] h-[450px]"
          />
        </div>
      </div>
      <div className="text-wrap">
        <p className=" bg-blue-200 font-semibold text-[25px]">
          Структура занятия
        </p>
        <p className="mt-[20px]">
          {" "}
          В идеале будет минимум два занятия в неделю - так вы не забудете
          пройденное между занятиями
        </p>
        <p className="mt-[10px] text-[20px]">
          Занятие для группы без экзамена- 1ч 30 мин{" "}
        </p>
        <p>14:00-14:20 - Обсуждение прочитанного в парах/тройках</p>
        <p>
          14:20 - 15:00 - Подготовка учебных материалов по интересным вещам из
          книги
        </p>
        <p>
          15:00-15:30 - Рекомендуемые пол часа решения заданий на повышение
          знаний по грамматике и лексике
        </p>
        <p className="mt-[10px] text-[20px]">
          Занятие для группы, которая планирует сдавать экзамен - 1ч 30 мин{" "}
        </p>
        <p>14:00-14:20 - Обсуждение прочитанного в парах/тройках</p>
        <p>
          14:20 - 15:00 - Работа над тестовой частью IELTS (решение заданий,
          разбор ошибок)
        </p>
        <p>15:00-15:30 - Пол часа на работу над письменной частью IELTS</p>
      </div>
    </main>
  );
}

export default page;
