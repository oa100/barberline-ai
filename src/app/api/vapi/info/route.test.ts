import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockSingle, mockGetServices, mockGetBusinessHours } = vi.hoisted(() => ({
  mockSingle: vi.fn(),
  mockGetServices: vi.fn(),
  mockGetBusinessHours: vi.fn(),
}));

vi.mock("@/lib/vapi/validate", () => ({
  validateVapiRequest: vi.fn(),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
  };
});

vi.mock("@/lib/booking/factory", () => ({
  getBookingProvider: vi.fn().mockReturnValue({
    getServices: mockGetServices,
    getBusinessHours: mockGetBusinessHours,
  }),
}));

import { POST } from "./route";
import { validateVapiRequest } from "@/lib/vapi/validate";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vapi/info", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeBody(params: Record<string, string> = {}, metadataShopId = "shop-1") {
  return {
    message: {
      functionCall: { parameters: { shopId: metadataShopId, ...params } },
      assistant: { metadata: { shopId: metadataShopId } },
    },
  };
}

const shopRow = {
  provider_type: "square",
  provider_token: "tok_123",
  provider_location_id: "loc_456",
  name: "Test Barber Shop",
};

describe("POST /api/vapi/info", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateVapiRequest).mockReturnValue(true);
    mockSingle.mockResolvedValue({ data: shopRow, error: null });
    mockGetServices.mockResolvedValue([]);
    mockGetBusinessHours.mockResolvedValue([]);
  });

  it("calls provider.getServices() and provider.getBusinessHours()", async () => {
    mockGetServices.mockResolvedValue([]);
    mockGetBusinessHours.mockResolvedValue([]);
    const res = await POST(makeRequest(makeBody()));
    expect(res.status).toBe(200);
    expect(mockGetServices).toHaveBeenCalledOnce();
    expect(mockGetBusinessHours).toHaveBeenCalledOnce();
  });

  it("formats services in voice response with name, priceDisplay, durationMinutes", async () => {
    mockGetServices.mockResolvedValue([
      { id: "svc-1", name: "Haircut", priceDisplay: "$25.00", durationMinutes: 30 },
      { id: "svc-2", name: "Beard Trim", priceDisplay: "$15.00", durationMinutes: 15 },
    ]);
    mockGetBusinessHours.mockResolvedValue([]);
    const res = await POST(makeRequest(makeBody()));
    const body = await res.json();
    expect(body.results[0].result).toContain("Haircut - $25.00 (30 min)");
    expect(body.results[0].result).toContain("Beard Trim - $15.00 (15 min)");
  });

  it("formats business hours in voice response with day name and formatted times", async () => {
    mockGetServices.mockResolvedValue([]);
    mockGetBusinessHours.mockResolvedValue([
      { dayOfWeek: "MON", openTime: "09:00", closeTime: "17:00" },
      { dayOfWeek: "SAT", openTime: "10:00", closeTime: "14:00" },
    ]);
    const res = await POST(makeRequest(makeBody()));
    const body = await res.json();
    expect(body.results[0].result).toContain("Monday: 9:00 AM - 5:00 PM");
    expect(body.results[0].result).toContain("Saturday: 10:00 AM - 2:00 PM");
  });

  it("handles empty services and hours", async () => {
    mockGetServices.mockResolvedValue([]);
    mockGetBusinessHours.mockResolvedValue([]);
    const res = await POST(makeRequest(makeBody()));
    const body = await res.json();
    expect(body.results[0].result).toContain("No services listed");
    expect(body.results[0].result).toContain("Hours not available");
  });

  it("returns 403 on shopId mismatch", async () => {
    const res = await POST(
      makeRequest({
        message: {
          functionCall: {
            parameters: { shopId: "attacker-shop" },
          },
          assistant: { metadata: { shopId: "real-shop" } },
        },
      })
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.results[0].result).toContain("mismatch");
  });

  it("handles shop not found gracefully", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "not found" } });
    const res = await POST(makeRequest(makeBody()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].result).toContain("couldn't find the shop");
  });
});
