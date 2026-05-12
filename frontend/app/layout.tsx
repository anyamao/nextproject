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
import { useAuthListener } from "@/hooks/useAuthListener";
import Footer from "../ui/footer";
import { useEffect } from "react";
import useContactStore from "@/store/states";
// import { apiFetch } from "@/lib/api";
import { AuthSync } from "@/components/AuthSync";
import CourseSidePanel from "../ui/CourseSidePanel";
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user: authUser } = useAuthListener();
  const setUser = useContactStore((state) => state.setUser);

  useEffect(() => {
    if (authUser && authUser.id && authUser.id > 0 && authUser.username) {
      const avatarToSet = authUser.avatar_url || "default_cat.jpg";

      setUser({ ...authUser, avatar_url: avatarToSet });
    }
  }, [authUser, setUser]);

  return (
    <html lang="en">
      <body className="overflow-x-hidden bg-gray-100">
        <div className="bg-gray-100 text-black min-w-full h-full min-h-[1500px] items-center flex flex-col">
          <Mainnav />
          <ProfileNavigation />
          <div
            className={`flex-1 flex flex-col w-full mt-[120px] bg-gray-100 z-19 h-full relative`}
          >
            <Login />
            <Signup />
            <ContactForm />
            <NavigationPanel />
            <CourseSidePanel></CourseSidePanel>
            <div className="w-full px-[10px] md:px-[20px]">{children}</div>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
