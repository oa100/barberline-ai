import { redirect } from "next/navigation";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { SimulateCallButton } from "@/components/dashboard/simulate-call-button";
import { TalkToAgentButton } from "@/components/dashboard/talk-to-agent-button";

export default async function DashboardPage() {
  const shop = await getAuthenticatedShop();

  if (!shop) {
    redirect("/dashboard/onboarding");
  }

  const supabase = await createClient();

  // Get today's date boundaries in the shop's timezone
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Query today's calls
  const { count: callsToday } = await supabase
    .from("call_logs")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString());

  // Query today's bookings (created today)
  const { count: bookedToday } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString());

  // Query upcoming appointments (start_time >= now)
  const { count: upcoming } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .eq("status", "confirmed")
    .gte("start_time", now.toISOString());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {shop.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Here is an overview of your shop today.
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <TalkToAgentButton
            shopId={shop.id}
            shopName={shop.name}
            greeting={shop.greeting}
            timezone={shop.timezone}
          />
          <SimulateCallButton shopId={shop.id} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Calls Today"
          value={callsToday ?? 0}
          description="Total calls received today"
        />
        <StatCard
          title="Booked Today"
          value={bookedToday ?? 0}
          description="Appointments booked today"
        />
        <StatCard
          title="Upcoming"
          value={upcoming ?? 0}
          description="Confirmed upcoming appointments"
        />
      </div>
    </div>
  );
}
