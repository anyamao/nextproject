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
    <div className="flex-1 flex min-w-full min-h-full relative ">1212122</div>
  );
}
