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
        <Link href="/english/A1/people">
          {" "}
          <ArrowLeft className="text-gray-600"></ArrowLeft>
        </Link>
        <div className="bg-purple-300 flex items-center justify-center w-[300px] h-[50px] rounded-full text-[20px] font-semibold">
          {" "}
          A1: People - Grammar
        </div>
      </div>
      <div className="text-wrap mt-[50px] ">
        <p className="font-semibold text-[25px]">
          Present simple vs Present Continuous
        </p>
        <p>
          Present Simple используется для фактов и рутины, того, что происходит
          обычно или является нормой, то есть характер человека, его привычки.
          Present Continuous — для действий прямо сейчас, то, что человек делает
          в данный момент, когда что-то изменено от нормы.
        </p>
        <p className="font-semibold mt-[10px]">
          Susan usually wears a black dress. Today she&apos;s wearing a blue
          dress.{" "}
        </p>
        <p className="mt-[10px]">
          Первое предложение это привычка Сьюзан, она обычно носит черное
          платье, поэтому тут используется Present Simple, также на это
          указывает и слово маркер usually, об этих словах позже. Второе
          предложение - отличие от нормы, сегодня Сьюзан одела голубое платье,
          она в нём прямо сейчас, потому предложение в Present Continuous. Но
          что если бы Сьюзан и сегодня бы одела черное платье, как всегда? В
          таком случае всё равно будет использоваться Present Continuous, ведь
          мы описываем то, что Сьюзан делает в данный момент, а в данный момент
          она в черном платье -{" "}
        </p>
        <p className="font-semibold inline">
          {" "}
          Today she&apos;s wearing a black dress, as usual.{" "}
        </p>
      </div>
      <div className="text-wrap">
        <p className="mt-[10px] text-[20px] font-semibold bg-purple-100">
          Present Simple (Простое настоящее){" "}
        </p>
        <p className="mt-[10px]">Используется, когда мы говорим о: </p>{" "}
        <p className="inline mt-[10px]">1) Постоянных фактах: </p>
        <p className="font-semibold inline">She lives in London. </p>{" "}
        <p className="inline">
          (Она живет в Лондоне — это факт, она там прописана).
        </p>
        <div className="flex flex-row mt-[10px] justify-start">
          <p className="mt-10px ">2) Регулярных действиях/привычках: </p>{" "}
          <p className="font-semibold inline">
            {" "}
            He usually drinks coffee in the morning.{" "}
          </p>{" "}
        </div>
        <div className="flex flex-row  mt-[10px] justify-start">
          <p> 3) Характере и личности:</p>{" "}
          <p className="font-semibold">They are very friendly. </p>{" "}
          <p>(Они дружелюбные по натуре). </p>{" "}
        </div>
        <p className="mt-[10px]">
          🔑 Маркеры: always, usually, often, sometimes, never, every day, on
          Mondays.
        </p>
      </div>

      <div className="text-wrap">
        <p className="mt-[10px] text-[20px] font-semibold bg-purple-100">
          Present Continuous (Настоящее длительное)
        </p>
        <p className="mt-[10px]">Используется, когда мы говорим о: </p>{" "}
        <p className="inline mt-[10px]">1) Действиях прямо сейчас: </p>
        <p className="font-semibold inline">
          She&apos;s wearing a black dress. It&apos;s raining.{" "}
        </p>{" "}
        <p className="inline"></p>
        <p className="mt-10px ">
          2) Временной ситуации:
          <span className="font-semibold">
            {" "}
            &nbsp;I am staying with my friend this week.{" "}
          </span>{" "}
          (Обычно я живу дома, но только эту неделю — у друга).
        </p>
        <p>
          {" "}
          3) Изменениях в развитии:
          <span className="font-semibold">
            &nbsp;Your English is getting better.{" "}
          </span>{" "}
        </p>
        <p>
          {" "}
          3) Раздражающих привычках:
          <span className="font-semibold">
            &nbsp;He&apos;s always leaving his socks on the floor!{" "}
          </span>{" "}
          Он вычно разбрасывает носки по полу! (это раздражает)
        </p>{" "}
        <p className="mt-[10px]">
          🔑 Маркеры: now, at the moment, currently, today, this week, Look!
        </p>
      </div>
    </main>
  );
}

export default page;
