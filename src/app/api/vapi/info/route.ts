import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { createSquareClient } from "@/lib/square/client";
import { listServices } from "@/lib/square/catalog";
import { getBusinessHours } from "@/lib/square/catalog";
import { createClient } from "@/lib/supabase/server";

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

  try {
    const body = await req.json();
    const params = body.message?.functionCall?.parameters ?? {};
    const { shopId } = params;

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

    const supabase = await createClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("square_token, square_location, name")
      .eq("id", shopId)
      .single();

    if (error || !shop?.square_token || !shop?.square_location) {
      return Response.json({
        results: [
          {
            result:
              "I'm sorry, I couldn't find the shop information right now.",
          },
        ],
      });
    }

    const client = createSquareClient(shop.square_token);

    const [services, hours] = await Promise.all([
      listServices(client, shop.square_location),
      getBusinessHours(client, shop.square_location),
    ]);

    // Format services
    const servicesText =
      services.length > 0
        ? services
            .map(
              (s) =>
                `${s.name} - $${s.priceAmount.toFixed(2)} (${s.durationMinutes} min)`
            )
            .join("; ")
        : "No services listed";

    // Format business hours
    const hoursText =
      hours.length > 0
        ? hours
            .map((p) => {
              const day = DAY_NAMES[p.dayOfWeek || ""] || p.dayOfWeek;
              return `${day}: ${formatTime(p.startLocalTime ?? undefined)} - ${formatTime(p.endLocalTime ?? undefined)}`;
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
