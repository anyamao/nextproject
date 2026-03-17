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
      <body>
        <div className="bg-white text-black min-w-screen min-h-screen flex flex-col items-center ">
          <Mainnav></Mainnav>
          <div className="flex-1 flex min-w-full min-h-full relative ">
            <ContactForm></ContactForm>
            <RegisterForm></RegisterForm>
            <NavigationPanel></NavigationPanel>
            <div className=" min-w-full">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
