import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { createSquareClient } from "@/lib/square/client";
import { createBooking } from "@/lib/square/booking";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const params = body.message?.functionCall?.parameters ?? {};
    const {
      shopId,
      startAt,
      customerName,
      customerPhone,
      serviceVariationId,
      teamMemberId,
      serviceName,
    } = params;

    if (!shopId || !startAt || !customerName || !serviceVariationId) {
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

    const supabase = await createClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("square_token, square_location, phone_number, name")
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

    const booking = await createBooking(client, {
      locationId: shop.square_location,
      startAt,
      customerName,
      customerPhone: customerPhone || "",
      serviceVariationId,
      teamMemberId,
    });

    if (!booking) {
      return Response.json({
        results: [
          {
            result:
              "I'm sorry, something went wrong creating the booking. Please try again.",
          },
        ],
      });
    }

    // Save booking record to Supabase
    const appointmentTime = new Date(startAt);
    await supabase.from("bookings").insert({
      shop_id: shopId,
      square_booking_id: booking.id || null,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      team_member_id: teamMemberId || null,
      service: serviceName || "Appointment",
      start_time: startAt,
      status: "confirmed",
    });

    // Send SMS confirmation to the barber
    if (shop.phone_number) {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await fetch(`${baseUrl}/api/twilio/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: shop.phone_number,
            message: `New booking: ${customerName} at ${appointmentTime.toLocaleString("en-US", { timeZone: "America/New_York" })} for ${serviceName || "an appointment"}. Booked via BarberLine AI.`,
          }),
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
          bookingId: booking.id,
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
