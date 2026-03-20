"use client";
import useContactStore from "@/store/states";
import { useEffect, useState } from "react";
import { MessageCircleMore } from "lucide-react";
function Contact() {
  const { contactState, toggleContact } = useContactStore();
  return (
    <main>
      <div
        className="cursor-pointer flex flex-row bg-orange-400 text-white px-[15px] py-[10px] text-[15px] rounded-full "
        onClick={toggleContact}
      >
        <MessageCircleMore className="mr-[7px] w-[20px]"></MessageCircleMore>
        <p>Написать</p>
      </div>
    </main>
  );
}

export default Contact;
