function page() {
  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[0px] py-[30px]  min-w-full min-h-full relative bg-gray-100">
      <div className="text-wrap">
        <p className="bigger-text bg-blue-300 font-semibold">
          Let&apos;s learn English together!
        </p>

        <div className="flex flex-row mt-[20px] border-b-[1px] border-b-gray-200 items-top justify-between">
          <div className="flex flex-col items-center md:items-start">
            {" "}
            <p className=" ord-text ">
              Клуб английского языка{" "}
              <span className="font-semibold"> &apos;Shakespeare&apos; </span>{" "}
              (Шэкспир), изучение английского через погружение в историю и
              литературу.
            </p>
            <p className="font-semibold ord-text mt-[10px]">
              {" "}
              Как будет происходить обучение?
            </p>
            <p className="ord-text">
              1) Выбираем книгу на английском и вместе читаем её по главам
            </p>
            <p className="ord-text">
              2) Обсуждаем прочитанное на английском на каждом занятии
            </p>
            <p className="ord-text">
              3) Находим интересные слова и конструкции, делаем учебный материал
            </p>
            <p className="ord-text">
              4) Каждый пишет рецензию на эту книгу на английском, обсуждаем
              работы друг друга
            </p>
            <p className="ord-text mt-[10px] font-semibold">
              {" "}
              Для тех, кто хочет серьёзно повышать уровень/ готовиться к
              экзаменам:{" "}
            </p>
            <p className="ord-text">
              {" "}
              Каждую неделю будем разбирать вариант IELTS{" "}
            </p>
            <p className="ord-text">
              Будем проходить учебные материалы, нужные для повышения уровня
            </p>
            <p className="border-t-[1px] font-semibold ord-text mt-[10px] py-[10px] border-t-gray-300">
              Будет весело, интересно и полезно для всех уровней английского и
              всех возрастов! Вы точно узнаете много нового и получите уйму
              практики, особенно такую ценную практику свободного говорения на
              английском. Записывайтесь! ;)
            </p>
            <a
              href="https://forms.gle/84kxA4BLtDyXyUKdA"
              target="_blank"
              className="bg-red-600 mt-[10px] mb-[20px] cursor-pointer text-white font-semibold bigger-text flex items-center justify-center rounded-full shadow-md hover:w-[240px] duration-300 transition-all w-[220px] h-[80px]"
            >
              Записаться
            </a>
            <p className="mb-[10px] ord-text">
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
        <p className=" bg-blue-200 font-semibold bigger-text">
          Структура занятия
        </p>
        <p className="mt-[20px] ord-text">
          {" "}
          В идеале будет минимум два занятия в неделю - так вы не забудете
          пройденное между занятиями
        </p>
        <p className="mt-[10px] font-semibold ord-text">
          Занятие для группы без экзамена- 1ч 30 мин{" "}
        </p>
        <div className="ord-text mt-[10px]">
          <p>14:00-14:20 - Обсуждение прочитанного в парах/тройках</p>
          <p>
            14:20 - 15:00 - Подготовка учебных материалов по интересным вещам из
            книги
          </p>
          <p>
            15:00-15:30 - Рекомендуемые пол часа решения заданий на повышение
            знаний по грамматике и лексике
          </p>
          <p className="mt-[10px] ord-text font-semibold">
            Занятие для группы, которая планирует сдавать экзамен - 1ч 30
            мин{" "}
          </p>
          <p className="mt-[10px]">
            14:00-14:20 - Обсуждение прочитанного в парах/тройках
          </p>
          <p>
            14:20 - 15:00 - Работа над тестовой частью IELTS (решение заданий,
            разбор ошибок)
          </p>
          <p>15:00-15:30 - Пол часа на работу над письменной частью IELTS</p>
        </div>
      </div>
    </main>
  );
}

export default page;
