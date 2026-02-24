import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedShop() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  return shop;
}
