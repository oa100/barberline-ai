import { describe, it, expect, vi } from "vitest";
import { searchAvailability } from "./availability";
import type { SquareClient } from "square";

function makeMockClient(response: unknown): SquareClient {
  return {
    bookings: {
      searchAvailability: vi.fn().mockResolvedValue(response),
    },
  } as unknown as SquareClient;
}

describe("searchAvailability", () => {
  const baseParams = {
    locationId: "LOC_1",
    startDate: "2026-03-01T00:00:00Z",
    endDate: "2026-03-02T00:00:00Z",
  };

  it("returns formatted time slots from Square API response", async () => {
    const client = makeMockClient({
      availabilities: [
        {
          startAt: "2026-03-01T10:00:00Z",
          appointmentSegments: [
            { teamMemberId: "TM_1", serviceVariationId: "SV_1" },
          ],
        },
        {
          startAt: "2026-03-01T11:00:00Z",
          appointmentSegments: [
            { teamMemberId: "TM_2", serviceVariationId: "SV_2" },
          ],
        },
      ],
    });

    const result = await searchAvailability(client, baseParams);

    expect(result).toEqual([
      {
        startAt: "2026-03-01T10:00:00Z",
        teamMemberId: "TM_1",
        serviceVariationId: "SV_1",
        locationId: "LOC_1",
      },
      {
        startAt: "2026-03-01T11:00:00Z",
        teamMemberId: "TM_2",
        serviceVariationId: "SV_2",
        locationId: "LOC_1",
      },
    ]);
  });

  it("returns empty array when no availability", async () => {
    const client = makeMockClient({ availabilities: undefined });
    const result = await searchAvailability(client, baseParams);
    expect(result).toEqual([]);
  });

  it("passes teamMemberId filter when provided", async () => {
    const client = makeMockClient({ availabilities: [] });
    await searchAvailability(client, {
      ...baseParams,
      serviceVariationId: "SV_1",
      teamMemberId: "TM_1",
    });

    expect(client.bookings.searchAvailability).toHaveBeenCalledWith({
      query: {
        filter: {
          startAtRange: {
            startAt: baseParams.startDate,
            endAt: baseParams.endDate,
          },
          locationId: "LOC_1",
          segmentFilters: [
            {
              serviceVariationId: "SV_1",
              teamMemberIdFilter: { any: ["TM_1"] },
            },
          ],
        },
      },
    });
  });

  it("omits segmentFilters when no serviceVariationId", async () => {
    const client = makeMockClient({ availabilities: [] });
    await searchAvailability(client, baseParams);

    expect(client.bookings.searchAvailability).toHaveBeenCalledWith({
      query: {
        filter: {
          startAtRange: {
            startAt: baseParams.startDate,
            endAt: baseParams.endDate,
          },
          locationId: "LOC_1",
          segmentFilters: undefined,
        },
      },
    });
  });
});
