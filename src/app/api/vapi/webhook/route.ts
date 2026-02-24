import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { createClient } from "@/lib/supabase/server";
import type { CallOutcome } from "@/lib/supabase/types";

function determineOutcome(summary: string | undefined): CallOutcome {
  if (!summary) return "hangup";

  const lower = summary.toLowerCase();
  if (lower.includes("booked") || lower.includes("appointment confirmed")) {
    return "booked";
  }
  if (
    lower.includes("no availability") ||
    lower.includes("no available") ||
    lower.includes("fully booked")
  ) {
    return "no_availability";
  }
  if (
    lower.includes("information") ||
    lower.includes("hours") ||
    lower.includes("services") ||
    lower.includes("pricing")
  ) {
    return "info_only";
  }
  if (
    lower.includes("couldn't help") ||
    lower.includes("transfer") ||
    lower.includes("unable")
  ) {
    return "fallback";
  }
  return "hangup";
}

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const { message } = body;

    // Only process end-of-call reports
    if (message?.type !== "end-of-call-report") {
      return Response.json({ ok: true });
    }

    const shopId = message.assistant?.metadata?.shopId;
    if (!shopId) {
      console.warn("Webhook: no shopId in assistant metadata");
      return Response.json({ ok: true });
    }

    const outcome = determineOutcome(message.summary);
    const callerPhone =
      message.customer?.number || message.call?.customer?.number || null;
    const durationSec = message.durationSeconds
      ? Math.round(message.durationSeconds)
      : null;

    const supabase = await createClient();

    await supabase.from("call_logs").insert({
      shop_id: shopId,
      vapi_call_id: message.call?.id || null,
      caller_phone: callerPhone,
      duration_sec: durationSec,
      outcome,
      transcript: message.transcript || null,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return Response.json({ ok: true }, { status: 200 });
  }
}
