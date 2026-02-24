import { redirect } from "next/navigation";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { createClient } from "@/lib/supabase/server";
import { CallTable } from "@/components/dashboard/call-table";
import type { CallLog } from "@/lib/supabase/types";

export default async function CallsPage() {
  const shop = await getAuthenticatedShop();

  if (!shop) {
    redirect("/signup");
  }

  const supabase = await createClient();

  const { data: calls } = await supabase
    .from("call_logs")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Call Log</h1>
      <CallTable calls={(calls as CallLog[]) ?? []} />
    </div>
  );
}
