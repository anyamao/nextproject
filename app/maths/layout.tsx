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
        <div className="bg-white relative text-black min-w-screen min-h-screen flex flex-row  ">
          <MathNav></MathNav>
          <div className="min-h-full  ml-[90px] w-full flex-1 ">{children}</div>
        </div>
      </body>
    </html>
  );
}
