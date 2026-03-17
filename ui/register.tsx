"use client";
import useContactStore from "@/store/states";
function Contactform() {
  const { registerState, toggleRegister } = useContactStore();

  return (
    <div className="cursor-pointer" onClick={toggleRegister}>
      register
    </div>
  );
}

export default Contactform;
