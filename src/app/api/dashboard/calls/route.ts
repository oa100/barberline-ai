import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";

export async function GET(req: NextRequest) {
  const shop = await getAuthenticatedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  // Get total count
  const { count } = await supabase
    .from("call_logs")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shop.id);

  // Get paginated call logs
  const { data: calls, error } = await supabase
    .from("call_logs")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to fetch call logs:", error);
    return NextResponse.json({ error: "Failed to fetch call logs" }, { status: 500 });
  }

  return NextResponse.json({
    calls: calls ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
