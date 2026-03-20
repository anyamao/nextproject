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
        <Link href="/english/A2/people">
          {" "}
          <ArrowLeft className="text-gray-600"></ArrowLeft>
        </Link>
        <div className="bg-purple-300 flex items-center justify-center w-[300px] h-[50px] rounded-full text-[20px] font-semibold">
          {" "}
          A2: People - Grammar
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
        <p className="mt-[10px] text-[25px] font-semibold bg-purple-100">
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
        <img src="/table1.png" className="w-[900px] mb-[-30px]" />
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
          Он вычно разбрасывает носки по полу! (это раздражает)
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
        <img src="/table2.png" className="w-[900px] mb-[-30px]" />
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
            href="https://forms.gle/UVDFZdo4zsV92gm79"
            target="_blank"
            className="bg-purple-600 cursor-pointer text-white hover:translate-y-[-10px]  hover:shadow-md transition-all hover: flex text-[20px] items-center justify-center font-semibold rounded-xl w-[350px] h-[80px]"
          >
            {" "}
            Take the test!{" "}
          </a>
        </div>
      </div>
    </main>
  );
}

export default page;
