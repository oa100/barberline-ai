import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { CallLog } from "@/lib/supabase/types";

export async function GET(req: NextRequest) {
  const shop = await getAuthenticatedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30", 10)));

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const supabase = await createClient();

  const { data: calls, error } = await supabase
    .from("call_logs")
    .select("*")
    .eq("shop_id", shop.id)
    .gte("created_at", sinceDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }

  const callLogs: CallLog[] = calls ?? [];

  const totalCalls = callLogs.length;
  const booked = callLogs.filter((c) => c.outcome === "booked").length;
  const conversionRate = totalCalls > 0 ? Math.round((booked / totalCalls) * 10000) / 100 : 0;

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
    const date = call.created_at.slice(0, 10); // YYYY-MM-DD
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

  return NextResponse.json({
    totalCalls,
    booked,
    conversionRate,
    avgDuration,
    byDate,
    byHour,
  });
}
