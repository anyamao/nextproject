import { createClient } from "@supabase/supabase-js";
import Mainnav from "./../ui/mainnav";
import ContactForm from "./../ui/contactform";
import RegisterForm from "./../ui/registerform";
import NavigationPanel from "./../ui/navigationpanel";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default async function Home() {
  return (
    <div className="flex-1 flex justify-center min-w-full min-h-full relative bg-blue-500 ">
      <div className="text-wrap mt-[40px] h-[800px] text-[30px] font-semibold w-[70%]">
        Бесплатные уроки по английскому, математике и другим предметам!
      </div>
    </div>
  );
}
