import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
  const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelect });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelectGet = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockImplementation(() => ({
    select: mockSelectGet,
    update: mockUpdate,
  }));

  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockSingle, mockFrom, mockUpdate },
  };
});

vi.mock("@/lib/dashboard/auth", () => ({
  getAuthenticatedShop: vi.fn(),
}));

import { PUT } from "./route";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks } from "@/lib/supabase/server";

const { mockSingle } = __mocks as {
  mockSingle: ReturnType<typeof vi.fn>;
};

const mockGetShop = vi.mocked(getAuthenticatedShop);

function makePutRequest(body: unknown) {
  return new NextRequest("http://localhost/api/dashboard/settings", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("PUT /api/dashboard/settings - input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetShop.mockResolvedValue({
      id: "shop_1",
      clerk_user_id: "user_123",
      name: "Fresh Cuts",
      timezone: "America/New_York",
      greeting: "Welcome!",
      phone_number: null,
      provider_type: "square",
      provider_token: null,
      provider_location_id: null,
      vapi_agent_id: null,
      created_at: "2026-01-01",
    });
    mockSingle.mockResolvedValue({
      data: {
        name: "Fresh Cuts",
        timezone: "America/New_York",
        greeting: "Welcome!",
        provider_token: null,
        vapi_agent_id: null,
        phone_number: null,
      },
      error: null,
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetShop.mockResolvedValue(null);

    const res = await PUT(makePutRequest({ name: "Test" }));
    expect(res.status).toBe(401);
  });

  it("rejects name that exceeds 200 characters", async () => {
    const res = await PUT(makePutRequest({ name: "A".repeat(201) }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("rejects empty name", async () => {
    const res = await PUT(makePutRequest({ name: "" }));
    expect(res.status).toBe(400);
  });

  it("rejects non-string name", async () => {
    const res = await PUT(makePutRequest({ name: 12345 }));
    expect(res.status).toBe(400);
  });

  it("rejects greeting that exceeds 1000 characters", async () => {
    const res = await PUT(makePutRequest({ greeting: "G".repeat(1001) }));
    expect(res.status).toBe(400);
  });

  it("rejects invalid timezone", async () => {
    const res = await PUT(makePutRequest({ timezone: "Not/A/Timezone" }));
    expect(res.status).toBe(400);
  });

  it("accepts valid timezone", async () => {
    const res = await PUT(makePutRequest({ timezone: "America/Chicago" }));
    expect(res.status).toBe(200);
  });

  it("accepts valid name within limits", async () => {
    const res = await PUT(makePutRequest({ name: "Valid Shop Name" }));
    expect(res.status).toBe(200);
  });

  it("accepts valid greeting within limits", async () => {
    const res = await PUT(makePutRequest({ greeting: "Hello there!" }));
    expect(res.status).toBe(200);
  });
});
