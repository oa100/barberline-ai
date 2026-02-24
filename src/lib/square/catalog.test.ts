import { describe, it, expect, vi } from "vitest";
import { listServices, getBusinessHours } from "./catalog";
import type { SquareClient } from "square";

function makeMockClient(overrides: {
  catalogResponse?: unknown;
  locationResponse?: unknown;
}): SquareClient {
  return {
    catalog: {
      searchItems: vi
        .fn()
        .mockResolvedValue(overrides.catalogResponse ?? { items: [] }),
    },
    locations: {
      get: vi.fn().mockResolvedValue(
        overrides.locationResponse ?? {
          location: { businessHours: { periods: [] } },
        }
      ),
    },
  } as unknown as SquareClient;
}

describe("listServices", () => {
  it("returns formatted service list", async () => {
    const client = makeMockClient({
      catalogResponse: {
        items: [
          {
            type: "ITEM",
            itemData: {
              name: "Haircut",
              variations: [
                {
                  id: "VAR_1",
                  type: "ITEM_VARIATION",
                  itemVariationData: {
                    name: "Standard",
                    serviceDuration: BigInt(1800000), // 30 min in ms
                    priceMoney: {
                      amount: BigInt(2500),
                      currency: "USD",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    });

    const result = await listServices(client, "LOC_1");

    expect(result).toEqual([
      {
        id: "VAR_1",
        name: "Haircut - Standard",
        durationMinutes: 30,
        priceAmount: 25,
        priceCurrency: "USD",
      },
    ]);

    expect(client.catalog.searchItems).toHaveBeenCalledWith({
      enabledLocationIds: ["LOC_1"],
      productTypes: ["APPOINTMENTS_SERVICE"],
    });
  });

  it("handles empty catalog", async () => {
    const client = makeMockClient({
      catalogResponse: { items: undefined },
    });

    const result = await listServices(client, "LOC_1");
    expect(result).toEqual([]);
  });

  it("skips non-ITEM types", async () => {
    const client = makeMockClient({
      catalogResponse: {
        items: [
          {
            type: "CATEGORY",
            itemData: { name: "Not a service", variations: [] },
          },
        ],
      },
    });

    const result = await listServices(client, "LOC_1");
    expect(result).toEqual([]);
  });
});

describe("getBusinessHours", () => {
  it("returns business hours periods", async () => {
    const periods = [
      { dayOfWeek: "MON", startLocalTime: "09:00:00", endLocalTime: "17:00:00" },
      { dayOfWeek: "TUE", startLocalTime: "09:00:00", endLocalTime: "17:00:00" },
    ];

    const client = makeMockClient({
      locationResponse: {
        location: { businessHours: { periods } },
      },
    });

    const result = await getBusinessHours(client, "LOC_1");

    expect(result).toEqual(periods);
    expect(client.locations.get).toHaveBeenCalledWith({
      locationId: "LOC_1",
    });
  });

  it("returns empty array when no business hours", async () => {
    const client = makeMockClient({
      locationResponse: { location: {} },
    });

    const result = await getBusinessHours(client, "LOC_1");
    expect(result).toEqual([]);
  });
});
