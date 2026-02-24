import { describe, it, expect, vi } from "vitest";
import type { SquareClient } from "square";

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

// Import after mock
const { createBooking, cancelBooking } = await import("./booking");

function makeMockClient(overrides: Record<string, unknown> = {}): SquareClient {
  return {
    bookings: {
      create: vi.fn().mockResolvedValue({
        booking: {
          id: "BK_1",
          locationId: "LOC_1",
          startAt: "2026-03-01T10:00:00Z",
          status: "ACCEPTED",
        },
        ...overrides,
      }),
      cancel: vi.fn().mockResolvedValue({
        booking: {
          id: "BK_1",
          status: "CANCELLED_BY_SELLER",
        },
        ...overrides,
      }),
    },
  } as unknown as SquareClient;
}

describe("createBooking", () => {
  it("creates booking with correct params and returns booking object", async () => {
    const client = makeMockClient();
    const params = {
      locationId: "LOC_1",
      startAt: "2026-03-01T10:00:00Z",
      customerName: "John Doe",
      customerPhone: "+15551234567",
      serviceVariationId: "SV_1",
      teamMemberId: "TM_1",
    };

    const result = await createBooking(client, params);

    expect(result).toEqual({
      id: "BK_1",
      locationId: "LOC_1",
      startAt: "2026-03-01T10:00:00Z",
      status: "ACCEPTED",
    });

    expect(client.bookings.create).toHaveBeenCalledWith({
      idempotencyKey: "test-uuid-1234",
      booking: {
        locationId: "LOC_1",
        startAt: "2026-03-01T10:00:00Z",
        appointmentSegments: [
          {
            serviceVariationId: "SV_1",
            teamMemberId: "TM_1",
            durationMinutes: undefined,
          },
        ],
        customerNote: "Booked by AI for John Doe (+15551234567)",
      },
    });
  });

  it("uses empty string for teamMemberId when not provided", async () => {
    const client = makeMockClient();
    await createBooking(client, {
      locationId: "LOC_1",
      startAt: "2026-03-01T10:00:00Z",
      customerName: "Jane",
      customerPhone: "+15559999999",
      serviceVariationId: "SV_2",
    });

    const callArgs = (client.bookings.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(callArgs.booking.appointmentSegments[0].teamMemberId).toBe("");
  });
});

describe("cancelBooking", () => {
  it("cancels booking with correct ID and version", async () => {
    const client = makeMockClient();
    const result = await cancelBooking(client, "BK_1", 3);

    expect(result).toEqual({
      id: "BK_1",
      status: "CANCELLED_BY_SELLER",
    });

    expect(client.bookings.cancel).toHaveBeenCalledWith({
      bookingId: "BK_1",
      bookingVersion: 3,
    });
  });
});
