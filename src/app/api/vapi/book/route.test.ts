import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockSingle, mockInsert, mockCreateBooking, mockSendSms } = vi.hoisted(() => ({
  mockSingle: vi.fn(),
  mockInsert: vi.fn(),
  mockCreateBooking: vi.fn(),
  mockSendSms: vi.fn(),
}));

vi.mock("@/lib/vapi/validate", () => ({
  validateVapiRequest: vi.fn(),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn((table: string) => {
    if (table === "bookings") {
      return { insert: mockInsert };
    }
    return { select: mockSelect };
  });
  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
  };
});

vi.mock("@/lib/booking/factory", () => ({
  getBookingProvider: vi.fn().mockReturnValue({
    checkAvailability: vi.fn(),
    createBooking: mockCreateBooking,
    getServices: vi.fn(),
    getBusinessHours: vi.fn(),
  }),
}));

vi.mock("@/lib/twilio/send-sms", () => ({
  sendSms: mockSendSms,
}));

import { POST } from "./route";
import { validateVapiRequest } from "@/lib/vapi/validate";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vapi/book", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeBody(params: Record<string, string>, metadataShopId = "shop-1") {
  return {
    message: {
      functionCall: { parameters: params },
      assistant: { metadata: { shopId: metadataShopId } },
    },
  };
}

const shopRow = {
  provider_type: "square",
  provider_token: "tok_123",
  provider_location_id: "loc_456",
  phone_number: "+15551234567",
  name: "Test Barber Shop",
};

const bookingResult = {
  providerBookingId: "booking-abc-123",
  startAt: "2026-03-01T14:00:00Z",
  serviceName: "Haircut",
  staffName: "John",
  confirmed: true,
};

describe("POST /api/vapi/book", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateVapiRequest).mockReturnValue(true);
    mockSingle.mockResolvedValue({ data: shopRow, error: null });
    mockCreateBooking.mockResolvedValue(bookingResult);
    mockInsert.mockResolvedValue({ error: null });
    mockSendSms.mockResolvedValue(undefined);
  });

  it("calls provider.createBooking with correct params", async () => {
    const res = await POST(
      makeRequest(
        makeBody({
          startAt: "2026-03-01T14:00:00Z",
          customerName: "Jane Doe",
          customerPhone: "+15559876543",
          serviceId: "svc-1",
          staffId: "staff-1",
        })
      )
    );
    expect(res.status).toBe(200);
    expect(mockCreateBooking).toHaveBeenCalledWith({
      startAt: "2026-03-01T14:00:00Z",
      customerName: "Jane Doe",
      customerPhone: "+15559876543",
      serviceId: "svc-1",
      staffId: "staff-1",
    });
  });

  it("saves booking to Supabase with provider_booking_id", async () => {
    await POST(
      makeRequest(
        makeBody({
          startAt: "2026-03-01T14:00:00Z",
          customerName: "Jane Doe",
          customerPhone: "+15559876543",
          serviceId: "svc-1",
          staffId: "staff-1",
          serviceName: "Haircut",
        })
      )
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        shop_id: "shop-1",
        provider_booking_id: "booking-abc-123",
        customer_name: "Jane Doe",
        customer_phone: "+15559876543",
        status: "confirmed",
      })
    );
  });

  it("returns confirmation message with bookingId on success", async () => {
    const res = await POST(
      makeRequest(
        makeBody({
          startAt: "2026-03-01T14:00:00Z",
          customerName: "Jane Doe",
        })
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].result).toContain("confirmed");
    expect(body.results[0].bookingId).toBe("booking-abc-123");
  });

  it("returns 400 when required params missing", async () => {
    // Missing customerName
    const res = await POST(
      makeRequest(
        makeBody({
          startAt: "2026-03-01T14:00:00Z",
        })
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when shopId is missing", async () => {
    const res = await POST(
      makeRequest({
        message: {
          functionCall: {
            parameters: {
              startAt: "2026-03-01T14:00:00Z",
              customerName: "Jane Doe",
            },
          },
          assistant: { metadata: {} },
        },
      })
    );
    expect(res.status).toBe(400);
  });

  it("handles provider failure gracefully", async () => {
    mockCreateBooking.mockRejectedValue(new Error("Provider is down"));
    const res = await POST(
      makeRequest(
        makeBody({
          startAt: "2026-03-01T14:00:00Z",
          customerName: "Jane Doe",
          serviceId: "svc-1",
        })
      )
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.results[0].result).toContain("trouble creating the booking");
  });
});
