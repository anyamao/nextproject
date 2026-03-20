import "./../globals.css";
import EnglishNav from "./../../ui/englishnavbar";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-gray-100 relative text-black min-w-screen min-h-screen justify-between  flex flex-row  ">
      <EnglishNav></EnglishNav>
      <div className=" flex justify-center items-center  px-[100px] mt-[50px]   flex-1 ">
        <div className=" border-gray-200 rounded-lg min-h-full flex-1 max-w-[1500px]">
          {children}
        </div>
      </div>
    </div>
  );
}
