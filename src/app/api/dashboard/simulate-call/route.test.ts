import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockSingle = vi.fn();
  const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
  const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockSingle, mockFrom },
  };
});

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: (name: string) => (name === "host" ? "localhost:3000" : null),
  }),
}));

import { POST } from "./route";
import { auth } from "@clerk/nextjs/server";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks } from "@/lib/supabase/server";

const { mockSingle } = __mocks as {
  mockSingle: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/dashboard/simulate-call", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Request;
}

describe("POST /api/dashboard/simulate-call", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as never);
    mockSingle.mockResolvedValue({ data: { id: "shop_1" }, error: null });

    // Mock the fetch call to the webhook
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const res = await POST(makeRequest({ shopId: "shop_1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when shopId is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when shop not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    const res = await POST(makeRequest({ shopId: "shop_1" }));
    expect(res.status).toBe(404);
  });

  it("calls the vapi webhook endpoint with correct payload", async () => {
    vi.stubEnv("VAPI_SERVER_SECRET", "test-secret");

    const res = await POST(makeRequest({ shopId: "shop_1" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toMatch(/Simulated call from .+ — (booked|info_only|no_availability)/);

    // Verify webhook was called
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/vapi/webhook",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-vapi-secret": "test-secret",
        }),
      })
    );
  });

  it("returns 500 when webhook fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const res = await POST(makeRequest({ shopId: "shop_1" }));
    expect(res.status).toBe(500);
  });
});
