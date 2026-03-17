import Contact from "./contact";
import Register from "./register";
import MainNavigation from "./mainnavigation";
function mainnav() {
  return (
    <div className="bg-white border-b-[1px] shadow-xs border-b-gray-300 min-w-screen min-h-[70px] items-center justify-between px-[100px] flex">
      <MainNavigation></MainNavigation>
      <div className="flex flex-row justify-between w-[150px]">
        <Contact></Contact>
        <Register></Register>
      </div>
    </div>
  );
}

export default mainnav;
