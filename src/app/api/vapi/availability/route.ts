import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { getBookingProvider } from "@/lib/booking/factory";
import { createServiceClient } from "@/lib/supabase/service";
import { extractShopId } from "@/lib/vapi/extract-shop-id";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = rateLimit(`vapi-availability:${ip}`, { limit: 100, windowMs: 60_000 });
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

    const { date, serviceId, staffId } = params;

    if (!shopId || !date) {
      return Response.json(
        {
          results: [
            {
              result:
                "I need the shop ID and a date to check availability. Could you provide those?",
            },
          ],
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("provider_type, provider_token, provider_location_id, timezone")
      .eq("id", shopId)
      .single();

    if (error || !shop?.provider_token || !shop?.provider_location_id) {
      return Response.json({
        results: [
          {
            result:
              "I'm sorry, I couldn't find the shop information. Please try again later.",
          },
        ],
      });
    }

    const provider = await getBookingProvider(shop);

    const slots = await provider.checkAvailability({ date, serviceId, staffId });

    if (slots.length === 0) {
      return Response.json({
        results: [
          {
            result: `There are no available time slots on ${date}. Would you like to check another date?`,
            availableSlots: [],
          },
        ],
      });
    }

    // Return top 3 slots formatted as readable times
    const topSlots = slots.slice(0, 3);
    const formattedTimes = topSlots
      .map((slot) => {
        const dt = new Date(slot.startAt);
        return dt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: shop.timezone || "America/Chicago",
        });
      })
      .join(", ");

    return Response.json({
      results: [
        {
          result: `Available times on ${date}: ${formattedTimes}. Which time works best for you?`,
          availableSlots: topSlots,
        },
      ],
    });
  } catch (err) {
    console.error("Availability check failed:", err);
    return Response.json(
      {
        results: [
          {
            result:
              "I'm sorry, I had trouble checking availability. Please try again.",
          },
        ],
      },
      { status: 500 }
    );
  }
}
