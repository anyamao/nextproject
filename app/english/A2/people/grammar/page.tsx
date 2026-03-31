"use client";
import {
  ArrowLeft,
  BookOpenText,
  Check,
  BookMarked,
  BookText,
  Speech,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
function Page() {
  const router = useRouter();

  const TEST_ID = "63eaf1f3-52c5-46eb-aa88-ee2ebc2df799"; // Replace with actual test ID

  const handleTakeTest = () => {
    // Pass returnUrl so test knows where to send user back
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/tests?id=${TEST_ID}&returnUrl=${returnUrl}`);
  };
  return (
    <main className=" flex-1 flex   flex-col items-center px-[10px] sm:px-[0px] py-[30px]  w-full h-full relative ">
      <div className="flex flex-row text-wrap-no items-center    justify-between">
        <Link href="/english/A2/people">
          {" "}
          <ArrowLeft></ArrowLeft>
        </Link>
        <div className="bg-purple-300 flex font-semobild ord-text items-center justify-center w-[180px] h-[40px] rounded-full ord-text font-semibold">
          A2:People - Grammar
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
          предложение - отличие от нормы, сегодня Сьюзан надела голубое платье,
          она в нём прямо сейчас, потому предложение в Present Continuous. Но
          что если бы Сьюзан и сегодня бы надела черное платье, как всегда? В
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
        <p className="mt-[10px] text-[25px] font-semibold bg-purple-100">
          Present Simple (Простое настоящее){" "}
        </p>
        <p className="mt-[10px]">Используется, когда мы говорим о: </p>{" "}
        <p className="inline mt-[10px]">1) Постоянных фактах: </p>
        <p className="font-semibold inline">She lives in London. </p>{" "}
        <p className="inline">
          (Она живет в Лондоне — это факт, она там прописана).
        </p>
        <p className="mt-10px ">2) Регулярных действиях/привычках: </p>{" "}
        <p className="font-semibold inline">
          {" "}
          He usually drinks coffee in the morning.{" "}
        </p>{" "}
        <p> 3) Характере и личности:</p>{" "}
        <p className="font-semibold">They are very friendly. </p>{" "}
        <p>(Они дружелюбны по натуре). </p>{" "}
        <p className="mt-[10px]">
          🔑 Маркеры: always, usually, often, sometimes, never, every day, on
          Mondays.
        </p>
        <p className="mt-[10px] bg-purple-100 font-semibold">
          {" "}
          Как формировать предложения?
        </p>
        <p className="mt-[10px]">
          {" "}
          Всё просто, общая структура в Present Simple это Object + Verb,
          например I drink, you sleep, she dances. Если вы говорите о дейтсвии,
          глагол to be в этом времени не используется, не говорят she is dances.
          Но если в предложении нет глагола то его заменяет глагол to be в
          нужной форме, частый случай - описание человека, he is interesting,
          you are beautiful. Are используется с you, we,they. Am используется
          только с I. Is используется во всех остальных случаях, или же с he,
          she, it, that, it, this.<br></br> Лучший способ запомнить это -
          разгвор на английском, так у вас сложется интуитивное понимание.
        </p>
        <img src="/table1.png" className="w-[900px] md:mb-[-30px]" />
      </div>

      <div className="text-wrap">
        <p className="mt-[10px] text-[25px] font-semibold bg-purple-100">
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
          Он вечно разбрасывает носки по полу! (это раздражает)
        </p>{" "}
        <p className="mt-[10px]">
          🔑 Маркеры: now, at the moment, currently, today, this week, Look!
        </p>
        <p className="mt-[10px] bg-purple-100 font-semibold">
          {" "}
          Как формировать предложения?
        </p>
        <p className="mt-[10px]">
          Здесь всегда будет использоваться как глагол to be так и обычный
          глагол. Общая структура -{" "}
          <span className="font-semibold"> Object + to be + Verb(ing). </span>{" "}
          Например - I am playing, we are cooking.
        </p>
        <img src="/table2.png" className="w-[900px] md:mb-[-30px]" />
      </div>
      <div className="text-wrap">
        <p className="mt-[10px] text-[25px] font-semibold bg-purple-100">
          Stative verbs (tricky part!)
        </p>
        <p className="mt-[10px]">
          {" "}
          Один и тот же глагол в Present Simple и Present Continuous будет
          значить разные вещи, например I think he&apos;s nice это мнение,
          мнение всегда в Present Simple. А I&apos;m thinking about him это то
          что происходит сейчас, я сейчас о нем думаю, поэтому Present
          Continuous. Так как мнения всегда в Present Simple, love, hate тоже
          будут в Present Simple, если вы хотите сказать что что-то любите или
          ненавидите.{" "}
        </p>
        <p className="mt-[10px]">
          <span className="font-semibold">
            Данные глаголы почти никогда нельзя использовать в Continuous{" "}
          </span>
          - love, hate, like, prefer, want, need, know, believe, understand,
          think (мнение), remember, have (владею), belong, cost, seem, be, see,
          hear, smell
        </p>
        <p className="mt-[10px]">
          Примеры правильной постановки частых предложений: <br></br> I know the
          answer. <br></br> I hear the noise. <br></br>This car belongs to
          me.{" "}
        </p>
        <p className="mt-[10px]">
          {" "}
          Также еще пример - He is rude. Это его черта характера, он обычно
          грубый. He is being rude today. Обычно он не грубый, сегодня он ведёт
          себя грубо.{" "}
        </p>
      </div>
      <div className="text-wrap ">
        <div className="flex mt-[30px]  justify-center">
          <a
            onClick={handleTakeTest}
            className="bg-purple-600 cursor-pointer text-white hover:translate-y-[-10px]  hover:shadow-md transition-all hover: flex text-[20px] items-center justify-center font-semibold rounded-xl md:w-[350px] w-[270px] h-[60px] md:h-[80px]"
          >
            {" "}
            Take the test!{" "}
          </a>
        </div>
      </div>
    </main>
  );
}

export default Page;
