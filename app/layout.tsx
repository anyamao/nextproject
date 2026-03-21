import "./globals.css";
import Mainnav from "./../ui/mainnav";
import ContactForm from "./../ui/contactform";
import RegisterForm from "./../ui/registerform";
import NavigationPanel from "./../ui/navigationpanel";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="overflow-x-hidden ">
        <div className="bg-white text-black   min-w-screen  min-h-screen items-center  flex flex-col  ">
          <Mainnav></Mainnav>
          <div
            className={`flex-1 flex w-full  bg-gray-100 z-19 h-full relative`}
          >
            <ContactForm></ContactForm>
            <RegisterForm></RegisterForm>
            <NavigationPanel></NavigationPanel>
            <div className="w-full">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
