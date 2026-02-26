import { randomUUID } from "crypto";
import { createSquareClient } from "@/lib/square/client";
import type {
  BookingProvider,
  TimeSlot,
  BookingResult,
  ServiceInfo,
  BusinessHours,
} from "../types";

export class SquareProvider implements BookingProvider {
  private client: ReturnType<typeof createSquareClient>;
  private locationId: string;

  constructor(accessToken: string, locationId: string) {
    this.client = createSquareClient(accessToken);
    this.locationId = locationId;
  }

  async checkAvailability(params: {
    date: string;
    serviceId?: string;
    staffId?: string;
  }): Promise<TimeSlot[]> {
    const startAt = `${params.date}T00:00:00Z`;
    const endAt = `${params.date}T23:59:59Z`;

    const response = await this.client.bookings.searchAvailability({
      query: {
        filter: {
          startAtRange: { startAt, endAt },
          locationId: this.locationId,
          segmentFilters: params.serviceId
            ? [
                {
                  serviceVariationId: params.serviceId,
                  teamMemberIdFilter: params.staffId
                    ? { any: [params.staffId] }
                    : undefined,
                },
              ]
            : undefined,
        },
      },
    });

    return (response.availabilities || []).map((a) => ({
      startAt: a.startAt!,
      durationMinutes: a.appointmentSegments?.[0]?.durationMinutes ?? 0,
      staffName: a.appointmentSegments?.[0]?.teamMemberId,
    }));
  }

  async createBooking(params: {
    startAt: string;
    customerName: string;
    customerPhone: string;
    serviceId?: string;
    staffId?: string;
  }): Promise<BookingResult> {
    const response = await this.client.bookings.create({
      idempotencyKey: randomUUID(),
      booking: {
        locationId: this.locationId,
        startAt: params.startAt,
        appointmentSegments: [
          {
            serviceVariationId: params.serviceId || "",
            teamMemberId: params.staffId || "",
          },
        ],
        customerNote: `Booked by AI for ${params.customerName} (${params.customerPhone})`,
      },
    });

    const booking = response.booking;
    if (!booking) {
      throw new Error("Square did not return a booking");
    }

    return {
      providerBookingId: booking.id!,
      startAt: booking.startAt!,
      serviceName: booking.appointmentSegments?.[0]?.serviceVariationId || "",
      staffName: booking.appointmentSegments?.[0]?.teamMemberId,
      confirmed: booking.status === "ACCEPTED",
    };
  }

  async getServices(): Promise<ServiceInfo[]> {
    const response = await this.client.catalog.searchItems({
      enabledLocationIds: [this.locationId],
      productTypes: ["APPOINTMENTS_SERVICE"],
    });

    return (response.items || []).flatMap((item) => {
      if (item.type !== "ITEM") return [];
      const itemData = item.itemData;
      return (itemData?.variations || []).flatMap((v) => {
        if (v.type !== "ITEM_VARIATION") return [];
        const varData = v.itemVariationData;
        const durationMinutes = Number(
          varData?.serviceDuration
            ? varData.serviceDuration / BigInt(60000)
            : 30
        );
        const priceAmount =
          Number(varData?.priceMoney?.amount || BigInt(0)) / 100;
        return [
          {
            id: v.id!,
            name: `${itemData?.name} - ${varData?.name}`,
            durationMinutes,
            priceDisplay: `$${priceAmount.toFixed(2)}`,
          },
        ];
      });
    });
  }

  async getBusinessHours(): Promise<BusinessHours[]> {
    const response = await this.client.locations.get({
      locationId: this.locationId,
    });

    const periods =
      response.location?.businessHours?.periods || [];

    return periods.map((p) => ({
      dayOfWeek: p.dayOfWeek!,
      openTime: (p.startLocalTime || "").slice(0, 5),
      closeTime: (p.endLocalTime || "").slice(0, 5),
    }));
  }
}
