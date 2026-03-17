"use client";
import useContactStore from "@/store/states";
function Contactform() {
  const { contactState, toggleContact } = useContactStore();

  return (
    <main>
      {contactState && (
        <div className="min-w-screen z-23 absolute min-h-full backdrop-blur-xs bg-white/30 flex justify-center flex-1">
          <div className="bg-pink-100 shadow-lg rounded-[10px] w-[500px] mt-[15%] h-[600px]">
            Contact me
          </div>
        </div>
      )}
    </main>
  );
}

export default Contactform;
