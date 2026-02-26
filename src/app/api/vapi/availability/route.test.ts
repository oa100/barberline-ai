import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockSingle, mockCheckAvailability } = vi.hoisted(() => ({
  mockSingle: vi.fn(),
  mockCheckAvailability: vi.fn(),
}));

vi.mock("@/lib/vapi/validate", () => ({
  validateVapiRequest: vi.fn(),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("@/lib/supabase/service", () => {
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  return {
    createServiceClient: vi.fn().mockReturnValue({ from: mockFrom }),
  };
});

vi.mock("@/lib/booking/factory", () => ({
  getBookingProvider: vi.fn().mockReturnValue({
    checkAvailability: mockCheckAvailability,
  }),
}));

import { POST } from "./route";
import { validateVapiRequest } from "@/lib/vapi/validate";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vapi/availability", {
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
  timezone: "America/New_York",
};

describe("POST /api/vapi/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateVapiRequest).mockReturnValue(true);
    mockSingle.mockResolvedValue({ data: shopRow, error: null });
    mockCheckAvailability.mockResolvedValue([]);
  });

  it("returns 401 when Vapi request is invalid", async () => {
    vi.mocked(validateVapiRequest).mockReturnValue(false);
    const res = await POST(
      makeRequest(makeBody({ date: "2026-03-01" }))
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when shopId mismatches metadata", async () => {
    const res = await POST(
      makeRequest({
        message: {
          functionCall: {
            parameters: { shopId: "attacker-shop", date: "2026-03-01" },
          },
          assistant: { metadata: { shopId: "real-shop" } },
        },
      })
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.results[0].result).toContain("mismatch");
  });

  it("returns 400 when date is missing", async () => {
    const res = await POST(makeRequest(makeBody({})));
    expect(res.status).toBe(400);
  });

  it("calls provider.checkAvailability with date, serviceId, staffId", async () => {
    mockCheckAvailability.mockResolvedValue([]);
    const res = await POST(
      makeRequest(
        makeBody({
          date: "2026-03-01",
          serviceId: "svc-1",
          staffId: "staff-1",
        })
      )
    );
    expect(res.status).toBe(200);
    expect(mockCheckAvailability).toHaveBeenCalledWith({
      date: "2026-03-01",
      serviceId: "svc-1",
      staffId: "staff-1",
    });
  });

  it("returns formatted time slots in voice response", async () => {
    mockCheckAvailability.mockResolvedValue([
      { startAt: "2026-03-01T14:00:00Z", durationMinutes: 30 },
      { startAt: "2026-03-01T15:00:00Z", durationMinutes: 30 },
    ]);
    const res = await POST(
      makeRequest(makeBody({ date: "2026-03-01" }))
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].result).toContain("Available times on 2026-03-01");
    expect(body.results[0].availableSlots).toHaveLength(2);
  });

  it("returns no-availability message when empty", async () => {
    mockCheckAvailability.mockResolvedValue([]);
    const res = await POST(
      makeRequest(makeBody({ date: "2026-03-01" }))
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].result).toContain("no available time slots");
    expect(body.results[0].availableSlots).toEqual([]);
  });

  it("handles shop not found gracefully", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "not found" } });
    const res = await POST(
      makeRequest(makeBody({ date: "2026-03-01" }))
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].result).toContain("couldn't find the shop");
  });
});
