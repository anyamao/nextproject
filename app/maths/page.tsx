function page() {
  return (
    <main>
      <div className="text-[25px] font-semibold">
        Сборник теории и практики по математике
      </div>

      <div className="flex flex-row mt-[20px] border-b-[1px] border-b-gray-200 items-top justify-between">
        <div className="text-[20px]">
          Здесь собраны материалы для подготовки к экзаменам по математике,
          планируется покрыть все темы из профильного ЕГЭ по математике.
          Приятной подготовки!
        </div>
        <img
          src="/Telegram Desktop/maths.png"
          className="  mt-[-50px] mr-[-20px] w-[550px]"
        />
      </div>
    </main>
  );
}

export default page;
