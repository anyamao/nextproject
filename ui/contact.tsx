"use client";
import useContactStore from "@/store/states";
import { useEffect, useState } from "react";
import { MessageCircleMore } from "lucide-react";
function Contact() {
  const { contactState, toggleContact } = useContactStore();
  return (
    <main>
      <div
        className="cursor-pointer items-center justify-center flex flex-row bg-orange-400 text-white px-[10px] py-[6px]   rounded-full sm:mr-[20px] "
        onClick={toggleContact}
      >
        <MessageCircleMore className=" w-[17px] mr-[7px] "></MessageCircleMore>
        <p className="smaller-text">Написать</p>
      </div>
    </main>
  );
}

export default Contact;
