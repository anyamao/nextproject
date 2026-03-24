"use client";

import "./globals.css";
import Mainnav from "./../ui/mainnav";
import ContactForm from "./../ui/contactform";
import NavigationPanel from "./../ui/navigationpanel";
import DatabaseStatus from "../ui/DatabaseStatus";
import Signup from "../ui/Signup";
import Login from "../ui/Login";
import { useAuthListener } from "@/hooks/useAuthListener";
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
          <DatabaseStatus></DatabaseStatus>
          <div
            className={`flex-1 flex w-full  bg-gray-100 z-19 h-full relative`}
          >
            <Login></Login>
            <Signup></Signup>
            <ContactForm></ContactForm>
            <NavigationPanel></NavigationPanel>
            <div className="w-full">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
