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
import { apiFetch } from "@/lib/api";
import { AuthSync } from "@/components/AuthSync";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuthListener();

  const setUser = useContactStore((state) => state.setUser);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      // Опционально: проверить валидность токена через /auth/me
      apiFetch("/auth/me")
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        });
    }
  }, []);
  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return (
    <html lang="en">
      <body className="overflow-x-hidden bg-gray-100">
        <div className="bg-gray-100 text-black   min-w-full  h-full min-h-[1500px] items-center  flex flex-col  ">
          <Mainnav></Mainnav>
          <ProfileNavigation></ProfileNavigation>
          <div
            className={`flex-1 flex flex-col w-full mt-[120px]  bg-gray-100 z-19 h-full relative`}
          >
            <Login></Login>
            <Signup></Signup>
            <ContactForm></ContactForm>
            <NavigationPanel></NavigationPanel>
            <div className="w-full px-[10px] md:px-[20px]  ">{children}</div>
          </div>
          <Footer></Footer>
        </div>
      </body>
    </html>
  );
}
