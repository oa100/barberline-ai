import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { to, shopId, startAt, customerName } = await req.json();

    if (!to || !shopId || !startAt || !customerName) {
      return NextResponse.json(
        { error: "Missing required fields: to, shopId, startAt, customerName" },
        { status: 400 }
      );
    }

    // Get shop name from Supabase
    const supabase = await createClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("name, timezone")
      .eq("id", shopId)
      .single();

    if (error || !shop) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }

    // Format date and time nicely
    const appointmentDate = new Date(startAt);
    const dateStr = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: shop.timezone || "America/New_York",
    });
    const timeStr = appointmentDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: shop.timezone || "America/New_York",
    });

    const message = `Hi ${customerName}! Your appointment at ${shop.name} is confirmed for ${dateStr} at ${timeStr}. Reply STOP to opt out.`;

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Twilio SMS send failed:", err);
    return NextResponse.json(
      { error: "Failed to send SMS" },
      { status: 500 }
    );
  }
}
