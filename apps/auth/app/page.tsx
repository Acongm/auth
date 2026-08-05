import { redirect } from "next/navigation";
import { createAuthServerClient, getDefaultReturnTo } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createAuthServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect(getDefaultReturnTo());
  }

  redirect("/login");
}
