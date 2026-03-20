function page() {
  return (
    <main className="">
      <div className="bg-white p-[50px] rounded-lg shadow-xs  border-[1px] border-gray-200">
        <div className="text-[25px] font-semibold">
          Сборник теории и практики по математике
        </div>

        <div className="flex md:flex-row flex-col mt-[20px] border-b-[1px] border-b-gray-200 items-top justify-between">
          <div className="text-[20px]">
            Здесь собраны материалы для подготовки к экзаменам по математике,
            планируется покрыть все темы из профильного ЕГЭ по математике.
            Приятной подготовки!
          </div>
          <img
            src="/maths.png"
            className="  md:mt-[-50px] mr-[-20px] md:w-[550px] md:h-[300px]"
          />
        </div>
      </div>
    </main>
  );
}

export default page;
