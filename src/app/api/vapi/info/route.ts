import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { getBookingProvider } from "@/lib/booking/factory";
import { createServiceClient } from "@/lib/supabase/service";
import { extractShopId } from "@/lib/vapi/extract-shop-id";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const DAY_NAMES: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

function formatTime(time: string | undefined): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${minutes} ${suffix}`;
}

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = rateLimit(`vapi-info:${ip}`, { limit: 100, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse();

  try {
    const body = await req.json();

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

    if (!shopId) {
      return Response.json(
        {
          results: [
            { result: "I need the shop ID to look up information." },
          ],
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("provider_type, provider_token, provider_location_id, name")
      .eq("id", shopId)
      .single();

    if (error || !shop?.provider_token || !shop?.provider_location_id) {
      return Response.json({
        results: [
          {
            result:
              "I'm sorry, I couldn't find the shop information right now.",
          },
        ],
      });
    }

    const provider = getBookingProvider(shop);

    const [services, hours] = await Promise.all([
      provider.getServices(),
      provider.getBusinessHours(),
    ]);

    // Format services
    const servicesText =
      services.length > 0
        ? services
            .map(
              (s) =>
                `${s.name} - ${s.priceDisplay} (${s.durationMinutes} min)`
            )
            .join("; ")
        : "No services listed";

    // Format business hours
    const hoursText =
      hours.length > 0
        ? hours
            .map((h) => {
              const day = DAY_NAMES[h.dayOfWeek || ""] || h.dayOfWeek;
              return `${day}: ${formatTime(h.openTime)} - ${formatTime(h.closeTime)}`;
            })
            .join("; ")
        : "Hours not available";

    return Response.json({
      results: [
        {
          result: `Here's the info for ${shop.name || "the shop"}. Services offered: ${servicesText}. Business hours: ${hoursText}.`,
          services,
          businessHours: hours,
        },
      ],
    });
  } catch (err) {
    console.error("Shop info lookup failed:", err);
    return Response.json(
      {
        results: [
          {
            result:
              "I'm sorry, I had trouble getting shop information. Please try again.",
          },
        ],
      },
      { status: 500 }
    );
  }
}
