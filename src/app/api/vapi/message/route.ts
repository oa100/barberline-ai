import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { createServiceClient } from "@/lib/supabase/service";
import twilio from "twilio";
import { extractShopId } from "@/lib/vapi/extract-shop-id";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = rateLimit(`vapi-message:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse();

  try {
    const body = await req.json();
    const params = body.message?.functionCall?.parameters ?? {};

    // Validate shopId against trusted metadata
    const { shopId, mismatch } = extractShopId(body);
    if (mismatch) {
      return Response.json(
        {
          results: [
            {
              result:
                "There was a shopId mismatch. Please try again.",
            },
          ],
        },
        { status: 403 }
      );
    }

    const { callerPhone, message } = params;

    if (!shopId || !message) {
      return Response.json(
        {
          results: [
            {
              result:
                "I need the shop and your message to send it to the barber.",
            },
          ],
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("phone_number, name")
      .eq("id", shopId)
      .single();

    if (error || !shop?.phone_number) {
      return Response.json({
        results: [
          {
            result:
              "I'm sorry, I don't have a phone number on file for this barber. Please try calling back later.",
          },
        ],
      });
    }

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const smsBody = callerPhone
      ? `Message from ${callerPhone} via BarberLine AI: ${message}`
      : `Message via BarberLine AI: ${message}`;

    await twilioClient.messages.create({
      to: shop.phone_number,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body: smsBody,
    });

    return Response.json({
      results: [
        {
          result: `I've sent your message to ${shop.name || "the barber"}. They should receive it shortly. Is there anything else I can help with?`,
        },
      ],
    });
  } catch (err) {
    console.error("Message send failed:", err);
    return Response.json(
      {
        results: [
          {
            result:
              "I'm sorry, I had trouble sending the message. Please try again later.",
          },
        ],
      },
      { status: 500 }
    );
  }
}
