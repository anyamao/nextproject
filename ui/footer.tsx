"use client";

import { usePathname } from "next/navigation";

function Footer() {
  const pathname = usePathname();

  // Скрываем футер на странице /tutor
  if (pathname === "/tutor") {
    return null;
  }
  return (
    <div className="w-full bg-gray-900   flex justify-center  ">
      <div className="text-wrap-no flex flex-col md:flex-row  justify-between">
        <div className="flex flex-col items-start border-gray-300 pb-[30px] pt-[10px] border-b-[1px] md:border-b-[0px]">
          <img src="/text3.png" className="  w-[150px]" />
          <p className="text-gray-300 font-semibold mt-[10px] ">
            Maoschool, 2026
          </p>
          <p className="text-gray-300  mt-[10px] ">О нас</p>
        </div>
        <div className="flex flex-col border-gray-300 border-b-[1px] pt-[10px]  pb-[30px]  md:border-b-[0px]">
          <p className="text-white font-semibold mt-[10px]">Учёба</p>
          <p className="text-gray-300  mt-[10px]">Подготовка к ЕГЭ</p>
          <p className="text-gray-300  mt-[10px]">Выучи английский!</p>
          <p className="text-gray-300  mt-[10px]">Программирование</p>
        </div>
        <div className="flex flex-col border-gray-300 border-b-[1px] pt-[10px]  pb-[30px]  md:border-b-[0px]">
          <p className="text-white font-semibold mt-[10px]">Мы в соцсетях</p>
          <p className="text-gray-300  mt-[10px]">Группа в вк</p>
          <p className="text-gray-300  mt-[10px]">Канал в тг</p>
        </div>
        <div className="flex flex-col border-gray-300  border-b-[1px] pt-[10px]  pb-[30px]  md:border-b-[0px]">
          <p className="text-white font-semibold mt-[10px]">Контакты</p>
          <p className="text-gray-300  mt-[10px]">vk: anyamaoo</p>
          <p className="text-gray-300  mt-[10px]">tg: anyamaoo</p>
          <p className="text-gray-300  mt-[10px]">email: anyamaoo@gmail.com</p>
        </div>
      </div>
    </div>
  );
}

export default Footer;
