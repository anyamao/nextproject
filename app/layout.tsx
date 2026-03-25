"use client";

import "./globals.css";
import Mainnav from "./../ui/mainnav";
import ContactForm from "./../ui/contactform";
import NavigationPanel from "./../ui/navigationpanel";
import DatabaseStatus from "../ui/DatabaseStatus";
import Signup from "../ui/Signup";
import Login from "../ui/Login";
import ProfileNavigation from "../ui/profile";
import ForgotPassword from "../ui/ForgotPassword";
import { useAuthListener } from "@/hooks/useAuthListener";
import Footer from "../ui/footer";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useAuthListener();

  return (
    <html lang="en">
      <body className="overflow-x-hidden bg-white">
        <div className="bg-white text-black   min-w-screen  min-h-screen items-center  flex flex-col  ">
          <Mainnav></Mainnav>
          <ProfileNavigation></ProfileNavigation>
          <div
            className={`flex-1 flex flex-col w-full  bg-gray-100 z-19 h-full relative`}
          >
            <Login></Login>
            <Signup></Signup>
            <ContactForm></ContactForm>
            <NavigationPanel></NavigationPanel>
            <ForgotPassword></ForgotPassword>
            <div className="w-full">{children}</div>
            <Footer></Footer>
          </div>
        </div>
      </body>
    </html>
  );
}
