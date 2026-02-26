import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { processEndOfCallReport } from "@/lib/vapi/process-end-of-call";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const result = await processEndOfCallReport(body.message);
    return Response.json(result);
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return Response.json({ ok: true }, { status: 200 });
  }
}
