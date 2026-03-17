"use client";
import useContactStore from "@/store/states";
import { useEffect, useState } from "react";

function Contact() {
  const { contactState, toggleContact } = useContactStore();
  return (
    <main>
      <div className="cursor-pointer" onClick={toggleContact}>
        contact
      </div>
    </main>
  );
}

export default Contact;
