import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { getBookingProvider } from "@/lib/booking/factory";
import { createServiceClient } from "@/lib/supabase/service";
import { sendSms } from "@/lib/twilio/send-sms";
import { extractShopId } from "@/lib/vapi/extract-shop-id";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = rateLimit(`vapi-book:${ip}`, { limit: 20, windowMs: 60_000 });
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

    const {
      startAt,
      customerName,
      customerPhone,
      serviceId,
      staffId,
      serviceName,
    } = params;

    if (!shopId || !startAt || !customerName) {
      return Response.json(
        {
          results: [
            {
              result:
                "I need your name, the time slot, and the service to complete the booking.",
            },
          ],
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("provider_type, provider_token, provider_location_id, phone_number, name")
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

    const provider = getBookingProvider(shop);

    const booking = await provider.createBooking({
      startAt,
      customerName,
      customerPhone: customerPhone || "",
      serviceId,
      staffId,
    });

    // Save booking record to Supabase
    const appointmentTime = new Date(startAt);
    await supabase.from("bookings").insert({
      shop_id: shopId,
      provider_booking_id: booking.providerBookingId,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      team_member_id: staffId || null,
      service: serviceName || "Appointment",
      start_time: startAt,
      status: "confirmed",
    });

    // Send SMS confirmation to the barber
    if (shop.phone_number) {
      try {
        await sendSms({
          to: shop.phone_number,
          body: `New booking: ${customerName} at ${appointmentTime.toLocaleString("en-US", { timeZone: "America/New_York" })} for ${serviceName || "an appointment"}. Booked via BarberLine AI.`,
        });
      } catch (smsErr) {
        console.error("SMS notification failed:", smsErr);
        // Don't fail the booking if SMS fails
      }
    }

    const formattedTime = appointmentTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    });

    return Response.json({
      results: [
        {
          result: `Your appointment is confirmed for ${formattedTime}. ${customerName}, you're all set! Is there anything else I can help with?`,
          bookingId: booking.providerBookingId,
        },
      ],
    });
  } catch (err) {
    console.error("Booking creation failed:", err);
    return Response.json(
      {
        results: [
          {
            result:
              "I'm sorry, I had trouble creating the booking. Please try again.",
          },
        ],
      },
      { status: 500 }
    );
  }
}
