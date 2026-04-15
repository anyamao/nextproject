"use client";
import toast from "react-hot-toast";
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
import { useEffect } from "react";
import useContactStore from "@/store/states";
import AISpace from "../ui/AISpace";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuthListener();

  const setUser = useContactStore((state) => state.setUser);

  // ✅ Sync Supabase auth to Zustand store
  useEffect(() => {
    setUser(user); // This automatically sets isAuthenticated: !!user
  }, [user, setUser]);

  return (
    <html lang="en">
      <body className="overflow-x-hidden bg-gray-100">
        <div className="bg-gray-100 text-black   min-w-full  h-full min-h-[1500px] items-center  flex flex-col  ">
          <Mainnav></Mainnav>
          <ProfileNavigation></ProfileNavigation>
          <AISpace />
          <div
            className={`flex-1 flex flex-col w-full mt-[120px]  bg-gray-100 z-19 h-full relative`}
          >
            <Login></Login>
            <Signup></Signup>
            <ContactForm></ContactForm>
            <NavigationPanel></NavigationPanel>
            <ForgotPassword></ForgotPassword>
            <div className="w-full px-[20px]  ">{children}</div>
          </div>
          <Footer></Footer>
        </div>
      </body>
    </html>
  );
}
