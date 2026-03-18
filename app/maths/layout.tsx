import "./../globals.css";
import MathNav from "./../../ui/mathnavbar";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="bg-gray-50 relative text-black min-w-screen min-h-screen justify-between  flex flex-row  ">
          <MathNav></MathNav>
          <div className=" flex justify-center items-center  px-[100px] mt-[50px]   flex-1 ">
            <div className="bg-white border-[1px] border-gray-200 rounded-lg p-[50px] min-h-full flex-1 max-w-[1500px]">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
