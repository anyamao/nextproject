"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useLesson } from "@/hooks/useLesson";
import {
  ArrowLeft,
  BookOpenText,
  Check,
  BookMarked,
  BookText,
  Speech,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Loader2,
  Send,
} from "lucide-react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import useContactStore from "@/store/states";

type TestResult = {
  score: number;
  passed: boolean;
  completed_at: string | null;
};
function Page() {
  const router = useRouter();
  const { user, isAuthenticated } = useContactStore();
  const TEST_ID = "63eaf1f3-52c5-46eb-aa88-ee2ebc2df799";

  const [result, setResult] = useState<TestResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const handleTakeTest = () => {
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/tests?id=${TEST_ID}&returnUrl=${returnUrl}`);
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoadingResult(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const { data, error } = await supabase
          .from("test_results")
          .select("score, passed, completed_at")
          .eq("user_id", user.id)
          .eq("test_id", TEST_ID)
          .order("score", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows
          throw error;
        }

        if (data) {
          setResult({
            score: data.score,
            passed: data.passed,
            completed_at: data.completed_at,
          });
        }
      } catch (err) {
        console.error("Error fetching test result:", err);
      } finally {
        setLoadingResult(false);
      }
    };

    fetchResult();
  }, [user, isAuthenticated, TEST_ID]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getResultBadge = () => {
    if (!isAuthenticated) {
      return {
        color: "gray",
        text: "—",
        border: "border-gray-300",
        bg: "bg-gray-100",
        textColor: "text-gray-500",
      };
    }

    if (loadingResult) {
      return {
        color: "gray",
        text: "...",
        border: "border-gray-300",
        bg: "bg-gray-100",
        textColor: "text-gray-500",
      };
    }

    if (!result) {
      return {
        color: "gray",
        text: "—",
        border: "border-gray-300",
        bg: "bg-gray-100",
        textColor: "text-gray-500",
      };
    }

    if (result.passed) {
      return {
        color: "green",
        text: `${result.score}%`,
        border: "border-green-500",
        bg: "bg-green-200",
        textColor: "text-green-900",
      };
    }

    return {
      color: "red",
      text: `${result.score}%`,
      border: "border-red-500",
      bg: "bg-red-200",
      textColor: "text-red-900",
    };
  };

  const badge = getResultBadge();
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
      <div className="  text-wrap-no  flex flex-col relative sm:flex-row items-center justify-between">
        <div className="bg-white flex ml-[-25px] p-[15px] items-center shadow-xs rounded-lg w-full sm:w-auto">
          <div className="font-semibold smaller-text">Поделитесь уроком</div>
          <button
            onClick={handleCopyLink}
            className="rounded-full ml-[15px] cursor-pointer items-center justify-center p-[7px] border-[1px] border-gray-400 hover:bg-gray-50 transition relative"
            title="Скопировать ссылку"
          >
            {copySuccess ? (
              <Check className="w-[15px] h-[15px] text-green-600" />
            ) : (
              <Copy className="w-[15px] h-[15px] text-gray-700" />
            )}
            {copySuccess && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Скопировано!
              </span>
            )}
          </button>
        </div>
        <div className="bg-white flex ml-[-25px] flex-row p-[15px] items-center shadow-xs rounded-lg w-full sm:w-auto justify-between sm:justify-start">
          <div className="font-semibold smaller-text">
            {loadingResult && !isAuthenticated
              ? "Загрузка..."
              : !isAuthenticated
                ? "Войдите, чтобы видеть результат"
                : !result
                  ? "Пройдите тест, чтобы узнать свой результат"
                  : result.passed
                    ? `Ваш результат по уроку - ${result.score}%! Так держать!`
                    : `Ваш результат по уроку - ${result.score}%! Вы можете лучше`}
          </div>
          <div
            className={`rounded-full smaller-text ml-[15px] w-[35px] h-[35px] cursor-default items-center justify-center flex border-[1px] ${badge.border} ${badge.bg} ${badge.textColor}`}
          >
            {badge.text}
          </div>
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
            {result?.passed ? "Пройти тест ещё раз" : "Пройти тест!"}
          </a>
        </div>
      </div>
      <div className="  text-wrap  flex flex-col sm:flex-row  relative items-center justify-between">
        <div className="flex flex-col items-center justify-center sm:justify-start sm:flex-row w-full">
          <div className="flex flex-col border-r-gray-300 sm:border-r-[1px] sm:pr-[40px] items-center">
            <div className="font-semibold ord-text mb-[10px]">
              Как вам урок?
            </div>
            <div className="flex flex-row">
              <button className="rounded-full smaller-text ml-[15px] p-[3px] px-[10px] cursor-pointer items-center justify-center flex border-[1px] border-gray-400 hover:bg-gray-50 transition">
                <p>Понятно</p>
                <ThumbsUp className="text-gray-700 ml-[5px] w-[15px] h-[15px]" />
                <p className="ml-[5px]">10</p>
              </button>
              <button className="rounded-full smaller-text ml-[15px] p-[3px] px-[10px] cursor-pointer items-center justify-center flex border-[1px] border-gray-400 hover:bg-gray-50 transition">
                <p>Не понятно</p>
                <ThumbsDown className="text-gray-700 ml-[5px] w-[15px] h-[15px]" />
                <p className="ml-[5px]">3</p>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between mt-[10px] sm:mt-[0px]">
          <div className="bg-purple-600 rounded-xl w-[200px] sm:w-[250px] flex flex-row items-center  hover:translate-y-[-5px]  hover:shadow-md transition-all  justify-center text-white p-[10px] px-[20px]">
            <p>Следующий урок</p>
            <ArrowRight className="text-white w-[20px] ml-[10px] h-[20px] " />
          </div>
        </div>
      </div>
      <div className="text-wrap-no flex flex-col">
        <p className="font-semibold border-b-[1px] border-b-gray-300 pb-[10px] mb-[20px]">
          Комментарии
        </p>
        <div className="flex flex-row items-center">
          {" "}
          <img src="/aiclose.png" className="w-[40px] h-[40px] rounded-full" />
          <input
            type="text"
            placeholder="Оставить комментарий"
            className="ml-[10px] flex-1 border-b border-gray-300 pb-2 outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>
    </main>
  );
}

export default Page;
