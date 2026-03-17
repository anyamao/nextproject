"use client";
import useContactStore from "@/store/states";
import { useEffect, useState } from "react";

function Navigation() {
  const { navigationState, toggleNavigation } = useContactStore();
  return (
    <main>
      <div className="cursor-pointer" onClick={toggleNavigation}>
        navigation
      </div>
    </main>
  );
}

export default Navigation;
