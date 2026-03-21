"use client";
import useContactStore from "@/store/states";
import { useEffect, useState } from "react";
import { MessageCircleMore } from "lucide-react";
function Contact() {
  const { contactState, toggleContact } = useContactStore();
  return (
    <main>
      <div
        className="cursor-pointer items-center justify-center flex flex-row bg-orange-400 text-white px-[8px] md:px-[12px] py-[5px] md:py-[8px] text-[10px] md:text-[15px] rounded-full "
        onClick={toggleContact}
      >
        <MessageCircleMore className="mr-[7px] w-[15px] md:w-[20px]"></MessageCircleMore>
        <p>Написать</p>
      </div>
    </main>
  );
}

export default Contact;
