"use client";
import useContactStore from "@/store/states";
function Registerform() {
  const { registerState, toggleRegister } = useContactStore();

  return (
    <main>
      {registerState && (
        <div className=" min-w-full absolute z-22  min-h-full  backdrop-blur-xs bg-white/30  flex justify-center flex-1">
          <div className="bg-white shadow-lg rounded-[10px] w-[500px] mt-[15%] h-[600px]">
            Register
          </div>
        </div>
      )}
    </main>
  );
}

export default Registerform;
