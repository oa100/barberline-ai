import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SquareClient } from "square";

// Mock the Square client factory
vi.mock("@/lib/square/client", () => ({
  createSquareClient: vi.fn(),
}));

vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return {
    ...actual,
    default: {
      ...actual,
      randomUUID: () => "test-uuid-1234",
    },
    randomUUID: () => "test-uuid-1234",
  };
});

import { createSquareClient } from "@/lib/square/client";
import { SquareProvider } from "./square";

const mockCreateSquareClient = vi.mocked(createSquareClient);

function makeMockClient() {
  return {
    bookings: {
      searchAvailability: vi.fn().mockResolvedValue({ availabilities: [] }),
      create: vi.fn().mockResolvedValue({ booking: null }),
    },
    catalog: {
      searchItems: vi.fn().mockResolvedValue({ items: [] }),
    },
    locations: {
      get: vi.fn().mockResolvedValue({ location: {} }),
    },
  } as unknown as SquareClient;
}

let mockClient: ReturnType<typeof makeMockClient>;

beforeEach(() => {
  mockClient = makeMockClient();
  mockCreateSquareClient.mockReturnValue(mockClient as SquareClient);
});

describe("SquareProvider", () => {
  describe("constructor", () => {
    it("creates a Square client with the access token", () => {
      new SquareProvider("tok_abc", "LOC_1");
      expect(createSquareClient).toHaveBeenCalledWith("tok_abc");
    });
  });

  describe("checkAvailability", () => {
    it("returns TimeSlot[] from Square response", async () => {
      (mockClient.bookings.searchAvailability as ReturnType<typeof vi.fn>).mockResolvedValue({
        availabilities: [
          {
            startAt: "2026-03-01T10:00:00Z",
            appointmentSegments: [
              { durationMinutes: 30, teamMemberId: "TM_1", serviceVariationId: "SV_1" },
            ],
          },
          {
            startAt: "2026-03-01T10:30:00Z",
            appointmentSegments: [
              { durationMinutes: 45, teamMemberId: "TM_2", serviceVariationId: "SV_1" },
            ],
          },
        ],
      });

      const provider = new SquareProvider("tok_abc", "LOC_1");
      const slots = await provider.checkAvailability({ date: "2026-03-01" });

      expect(slots).toEqual([
        { startAt: "2026-03-01T10:00:00Z", durationMinutes: 30, staffName: "TM_1" },
        { startAt: "2026-03-01T10:30:00Z", durationMinutes: 45, staffName: "TM_2" },
      ]);
    });

    it("returns empty array when no slots available", async () => {
      (mockClient.bookings.searchAvailability as ReturnType<typeof vi.fn>).mockResolvedValue({
        availabilities: [],
      });

      const provider = new SquareProvider("tok_abc", "LOC_1");
      const slots = await provider.checkAvailability({ date: "2026-03-01" });

      expect(slots).toEqual([]);
    });

    it("passes serviceId and staffId to Square API", async () => {
      const provider = new SquareProvider("tok_abc", "LOC_1");
      await provider.checkAvailability({
        date: "2026-03-01",
        serviceId: "SV_1",
        staffId: "TM_1",
      });

      expect(mockClient.bookings.searchAvailability).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            filter: expect.objectContaining({
              locationId: "LOC_1",
              segmentFilters: [
                {
                  serviceVariationId: "SV_1",
                  teamMemberIdFilter: { any: ["TM_1"] },
                },
              ],
            }),
          }),
        })
      );
    });
  });

  describe("createBooking", () => {
    it("returns BookingResult from Square response", async () => {
      (mockClient.bookings.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        booking: {
          id: "BK_1",
          startAt: "2026-03-01T10:00:00Z",
          appointmentSegments: [
            { serviceVariationId: "SV_1", teamMemberId: "TM_1" },
          ],
          status: "ACCEPTED",
        },
      });

      const provider = new SquareProvider("tok_abc", "LOC_1");
      const result = await provider.createBooking({
        startAt: "2026-03-01T10:00:00Z",
        customerName: "John Doe",
        customerPhone: "+15551234567",
        serviceId: "SV_1",
        staffId: "TM_1",
      });

      expect(result).toEqual({
        providerBookingId: "BK_1",
        startAt: "2026-03-01T10:00:00Z",
        serviceName: "SV_1",
        staffName: "TM_1",
        confirmed: true,
      });
    });

    it("throws when Square returns no booking", async () => {
      (mockClient.bookings.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        booking: null,
      });

      const provider = new SquareProvider("tok_abc", "LOC_1");
      await expect(
        provider.createBooking({
          startAt: "2026-03-01T10:00:00Z",
          customerName: "John Doe",
          customerPhone: "+15551234567",
        })
      ).rejects.toThrow("Square did not return a booking");
    });
  });

  describe("getServices", () => {
    it("returns ServiceInfo[] with priceDisplay formatted as $XX.XX", async () => {
      (mockClient.catalog.searchItems as ReturnType<typeof vi.fn>).mockResolvedValue({
        items: [
          {
            type: "ITEM",
            itemData: {
              name: "Haircut",
              variations: [
                {
                  id: "SV_1",
                  type: "ITEM_VARIATION",
                  itemVariationData: {
                    name: "Regular",
                    serviceDuration: BigInt(1800000), // 30 min
                    priceMoney: { amount: BigInt(2500), currency: "USD" },
                  },
                },
              ],
            },
          },
        ],
      });

      const provider = new SquareProvider("tok_abc", "LOC_1");
      const services = await provider.getServices();

      expect(services).toEqual([
        {
          id: "SV_1",
          name: "Haircut - Regular",
          durationMinutes: 30,
          priceDisplay: "$25.00",
        },
      ]);
    });

    it("returns empty array for empty catalog", async () => {
      (mockClient.catalog.searchItems as ReturnType<typeof vi.fn>).mockResolvedValue({
        items: [],
      });

      const provider = new SquareProvider("tok_abc", "LOC_1");
      const services = await provider.getServices();

      expect(services).toEqual([]);
    });
  });

  describe("getBusinessHours", () => {
    it("returns BusinessHours[] with openTime/closeTime trimmed to HH:MM", async () => {
      (mockClient.locations.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        location: {
          businessHours: {
            periods: [
              { dayOfWeek: "MON", startLocalTime: "09:00:00", endLocalTime: "17:00:00" },
              { dayOfWeek: "TUE", startLocalTime: "10:00:00", endLocalTime: "18:30:00" },
            ],
          },
        },
      });

      const provider = new SquareProvider("tok_abc", "LOC_1");
      const hours = await provider.getBusinessHours();

      expect(hours).toEqual([
        { dayOfWeek: "MON", openTime: "09:00", closeTime: "17:00" },
        { dayOfWeek: "TUE", openTime: "10:00", closeTime: "18:30" },
      ]);
    });

    it("returns empty array when no hours configured", async () => {
      (mockClient.locations.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        location: {},
      });

      const provider = new SquareProvider("tok_abc", "LOC_1");
      const hours = await provider.getBusinessHours();

      expect(hours).toEqual([]);
    });
  });
});
