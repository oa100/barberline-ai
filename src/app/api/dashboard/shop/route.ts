import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";

export async function GET() {
  const shop = await getAuthenticatedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(shop);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Check if shop already exists for this user
  const { data: existingShop } = await supabase
    .from("shops")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  if (existingShop) {
    return NextResponse.json(existingShop);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "My Shop";
  const timezone = typeof body.timezone === "string" && body.timezone.trim()
    ? body.timezone.trim()
    : "America/New_York";

  const { data: newShop, error } = await supabase
    .from("shops")
    .insert({
      clerk_user_id: userId,
      name,
      timezone,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create shop:", error);
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 });
  }

  return NextResponse.json(newShop, { status: 201 });
}
