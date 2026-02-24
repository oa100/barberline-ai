import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { createSquareClient } from "@/lib/square/client";
import { searchAvailability } from "@/lib/square/availability";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const params = body.message?.functionCall?.parameters ?? {};
    const { shopId, date, teamMemberId, serviceVariationId } = params;

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

    const supabase = await createClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("square_token, square_location, timezone")
      .eq("id", shopId)
      .single();

    if (error || !shop?.square_token || !shop?.square_location) {
      return Response.json({
        results: [
          {
            result:
              "I'm sorry, I couldn't find the shop information. Please try again later.",
          },
        ],
      });
    }

    const client = createSquareClient(shop.square_token);

    // Build date range for the requested day
    const startDate = `${date}T00:00:00Z`;
    const endDate = `${date}T23:59:59Z`;

    const slots = await searchAvailability(client, {
      locationId: shop.square_location,
      startDate,
      endDate,
      serviceVariationId,
      teamMemberId,
    });

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
          timeZone: shop.timezone || "America/New_York",
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
