import { redirect } from "next/navigation";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createAuthServerClient, getDefaultReturnTo } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!getSupabasePublicEnv()) {
    redirect("/login");
  }

  const supabase = await createAuthServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect(getDefaultReturnTo());
  }

  redirect("/login");
}
