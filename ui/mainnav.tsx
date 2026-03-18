import Contact from "./contact";
import Register from "./register";
import MainNavigation from "./mainnavigation";
function mainnav() {
  return (
    <div className="border-b-[1px] shadow-xs border-b-gray-300 min-w-screen min-h-[70px] items-center justify-center px-[100px] flex">
      <div className="flex flex-row max-w-[900px] flex-1 items-center justify-between">
        {" "}
        <MainNavigation></MainNavigation>
        <div className="flex flex-row justify-between w-[150px]">
          <Contact></Contact>
          <Register></Register>
        </div>
      </div>
    </div>
  );
}

export default mainnav;
