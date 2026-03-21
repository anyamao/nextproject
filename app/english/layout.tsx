import "./../globals.css";
import EnglishNav from "./../../ui/englishnavbar";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-white text-black  w-full h-full   flex  flex-row  ">
      <EnglishNav></EnglishNav>
      <div className={`flex-1 flex w-full  bg-gray-100 z-19 h-full relative`}>
        {children}
      </div>
    </div>
  );
}
