import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";

export async function GET() {
  const shop = await getAuthenticatedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    name: shop.name,
    timezone: shop.timezone,
    greeting: shop.greeting,
    hasSquare: !!shop.square_token,
    hasVapi: !!shop.vapi_agent_id,
    phoneNumber: shop.phone_number,
  });
}

const ALLOWED_FIELDS = ["name", "timezone", "greeting"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function PUT(req: NextRequest) {
  const shop = await getAuthenticatedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Filter to only allowed fields
  const updates: Partial<Record<AllowedField, unknown>> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shops")
    .update(updates)
    .eq("id", shop.id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update shop settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  return NextResponse.json({
    name: data.name,
    timezone: data.timezone,
    greeting: data.greeting,
    hasSquare: !!data.square_token,
    hasVapi: !!data.vapi_agent_id,
    phoneNumber: data.phone_number,
  });
}
