import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { processEndOfCallReport } from "@/lib/vapi/process-end-of-call";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = rateLimit(`vapi-webhook:${ip}`, { limit: 100, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse();

  try {
    const body = await req.json();
    const result = await processEndOfCallReport(body.message);
    return Response.json(result);
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return Response.json({ ok: true }, { status: 200 });
  }
}
