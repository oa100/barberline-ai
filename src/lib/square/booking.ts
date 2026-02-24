import { SquareClient } from "square";
import { randomUUID } from "crypto";

interface CreateBookingParams {
  locationId: string;
  startAt: string;
  customerName: string;
  customerPhone: string;
  serviceVariationId: string;
  teamMemberId?: string;
  durationMinutes?: number;
}

export async function createBooking(
  client: SquareClient,
  params: CreateBookingParams
) {
  const response = await client.bookings.create({
    idempotencyKey: randomUUID(),
    booking: {
      locationId: params.locationId,
      startAt: params.startAt,
      appointmentSegments: [
        {
          serviceVariationId: params.serviceVariationId,
          teamMemberId: params.teamMemberId || "",
          durationMinutes: params.durationMinutes ?? undefined,
        },
      ],
      customerNote: `Booked by AI for ${params.customerName} (${params.customerPhone})`,
    },
  });

  return response.booking;
}

export async function cancelBooking(
  client: SquareClient,
  bookingId: string,
  bookingVersion: number
) {
  const response = await client.bookings.cancel({
    bookingId,
    bookingVersion,
  });
  return response.booking;
}
