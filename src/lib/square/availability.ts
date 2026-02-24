import { SquareClient } from "square";

interface AvailabilityParams {
  locationId: string;
  startDate: string;
  endDate: string;
  serviceVariationId?: string;
  teamMemberId?: string;
}

interface TimeSlot {
  startAt: string;
  teamMemberId?: string;
  serviceVariationId: string;
  locationId: string;
}

export async function searchAvailability(
  client: SquareClient,
  params: AvailabilityParams
): Promise<TimeSlot[]> {
  const response = await client.bookings.searchAvailability({
    query: {
      filter: {
        startAtRange: {
          startAt: params.startDate,
          endAt: params.endDate,
        },
        locationId: params.locationId,
        segmentFilters: params.serviceVariationId
          ? [
              {
                serviceVariationId: params.serviceVariationId,
                teamMemberIdFilter: params.teamMemberId
                  ? { any: [params.teamMemberId] }
                  : undefined,
              },
            ]
          : undefined,
      },
    },
  });

  return (response.availabilities || []).map((a) => ({
    startAt: a.startAt!,
    teamMemberId: a.appointmentSegments?.[0]?.teamMemberId,
    serviceVariationId: a.appointmentSegments?.[0]?.serviceVariationId || "",
    locationId: params.locationId,
  }));
}
