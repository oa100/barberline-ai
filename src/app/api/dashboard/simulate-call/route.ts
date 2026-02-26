import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { processEndOfCallReport } from "@/lib/vapi/process-end-of-call";

const SAMPLE_CALLERS = [
  { name: "Marcus Johnson", phone: "+12125551001" },
  { name: "DeAndre Williams", phone: "+13105551002" },
  { name: "James Carter", phone: "+17185551003" },
  { name: "Andre Mitchell", phone: "+14155551004" },
  { name: "Tyrone Davis", phone: "+12025551005" },
];

const SAMPLE_SERVICES = [
  "Classic Fade",
  "Beard Trim",
  "Hot Towel Shave",
  "Line Up",
  "Full Cut + Beard",
  "Kids Cut",
];

const SCENARIOS = [
  { summary: "Customer called and booked an appointment for a {service}. Appointment confirmed.", outcome: "booked" },
  { summary: "Customer called and booked a {service}. Appointment confirmed for tomorrow.", outcome: "booked" },
  { summary: "Customer asked about availability but no available slots. Fully booked this week.", outcome: "no_availability" },
  { summary: "Customer called asking about hours and pricing information.", outcome: "info_only" },
  { summary: "Customer called and booked an appointment. Appointment confirmed.", outcome: "booked" },
] as const;

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shopId } = await req.json();
  if (!shopId) {
    return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify shop belongs to user
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("clerk_user_id", userId)
    .single();

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const caller = randomFrom(SAMPLE_CALLERS);
  const service = randomFrom(SAMPLE_SERVICES);
  const scenario = randomFrom(SCENARIOS);
  const duration = 30 + Math.random() * 150;
  const summary = scenario.summary.replace("{service}", service);

  // Build a Vapi end-of-call-report message
  const message = {
    type: "end-of-call-report",
    call: {
      id: `sim_${Date.now()}`,
      customer: { number: caller.phone },
    },
    assistant: {
      metadata: { shopId },
    },
    summary,
    durationSeconds: duration,
    transcript: [
      { role: "assistant", content: "Hello! Thanks for calling. I'm the AI assistant for this barbershop. How can I help you today?" },
      { role: "user", content: `Hi, I'd like to book a ${service} please.` },
      ...(scenario.outcome === "booked"
        ? [
            { role: "assistant", content: `Great! I have availability tomorrow at 2:00 PM for a ${service}. Shall I book that for you?` },
            { role: "user", content: "Yes, that works perfectly." },
            { role: "assistant", content: `Done! You're booked for a ${service} tomorrow at 2:00 PM. You'll receive an SMS confirmation shortly.` },
          ]
        : scenario.outcome === "no_availability"
        ? [
            { role: "assistant", content: "I'm sorry, it looks like we're fully booked for the next few days." },
            { role: "user", content: "Okay, I'll try again next week." },
          ]
        : [
            { role: "assistant", content: "We're open Monday through Saturday, 9 AM to 7 PM. A Classic Fade is $35, a Beard Trim is $20." },
            { role: "user", content: "Great, thanks for the info!" },
          ]),
    ],
  };

  // Call the webhook logic directly instead of via HTTP (prevents SSRF)
  try {
    await processEndOfCallReport(message);
  } catch {
    return NextResponse.json(
      { error: "Failed to process simulated call" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    summary: `Simulated call from ${caller.name} — ${scenario.outcome}${scenario.outcome === "booked" ? ` (${service})` : ""}`,
  });
}
