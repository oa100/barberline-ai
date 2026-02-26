import { createServiceClient } from "@/lib/supabase/service";
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

interface VapiMessage {
  type?: string;
  assistant?: { metadata?: { shopId?: string } };
  call?: { id?: string; customer?: { number?: string } };
  customer?: { number?: string };
  summary?: string;
  durationSeconds?: number;
  transcript?: unknown;
}

export async function processEndOfCallReport(message: VapiMessage): Promise<{ ok: boolean }> {
  // Only process end-of-call reports
  if (message?.type !== "end-of-call-report") {
    return { ok: true };
  }

  const shopId = message.assistant?.metadata?.shopId;
  if (!shopId) {
    console.warn("Webhook: no shopId in assistant metadata");
    return { ok: true };
  }

  const outcome = determineOutcome(message.summary);
  const callerPhone =
    message.customer?.number || message.call?.customer?.number || null;
  const durationSec = message.durationSeconds
    ? Math.round(message.durationSeconds)
    : null;

  const supabase = createServiceClient();

  await supabase.from("call_logs").insert({
    shop_id: shopId,
    vapi_call_id: message.call?.id || null,
    caller_phone: callerPhone,
    duration_sec: durationSec,
    outcome,
    transcript: message.transcript || null,
  });

  return { ok: true };
}
