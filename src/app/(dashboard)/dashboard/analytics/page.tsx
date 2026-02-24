import { redirect } from "next/navigation";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { createClient } from "@/lib/supabase/server";
import { CallLog } from "@/lib/supabase/types";
import { StatCard } from "@/components/dashboard/stat-card";
import { CallVolumeChart, PeakHoursChart } from "@/components/dashboard/charts";

export default async function AnalyticsPage() {
  const shop = await getAuthenticatedShop();

  if (!shop) {
    redirect("/signup");
  }

  const supabase = await createClient();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);

  const { data: calls } = await supabase
    .from("call_logs")
    .select("*")
    .eq("shop_id", shop.id)
    .gte("created_at", sinceDate.toISOString())
    .order("created_at", { ascending: true });

  const callLogs: CallLog[] = calls ?? [];

  // Compute summary stats
  const totalCalls = callLogs.length;
  const booked = callLogs.filter((c) => c.outcome === "booked").length;
  const conversionRate =
    totalCalls > 0 ? Math.round((booked / totalCalls) * 10000) / 100 : 0;

  const durations = callLogs
    .map((c) => c.duration_sec)
    .filter((d): d is number => d !== null);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 0;

  // Group by date
  const dateMap = new Map<string, { total: number; booked: number }>();
  for (const call of callLogs) {
    const date = call.created_at.slice(0, 10);
    const entry = dateMap.get(date) || { total: 0, booked: 0 };
    entry.total++;
    if (call.outcome === "booked") entry.booked++;
    dateMap.set(date, entry);
  }
  const byDate = Array.from(dateMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by hour
  const hourMap = new Map<number, number>();
  for (const call of callLogs) {
    const hour = new Date(call.created_at).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  }
  const byHour = Array.from(hourMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Call performance over the last 30 days.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Calls"
          value={totalCalls}
          description="Last 30 days"
        />
        <StatCard
          title="Booked"
          value={booked}
          description="Appointments made"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          description="Calls that booked"
        />
        <StatCard
          title="Avg Duration"
          value={`${avgDuration}s`}
          description="Average call length"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CallVolumeChart data={byDate} />
        <PeakHoursChart data={byHour} />
      </div>
    </div>
  );
}
