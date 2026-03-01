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

  const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

  return {
    createClient: vi.fn().mockResolvedValue({
      from: (table: string) => {
        if (table === "shops") {
          return { select: mockSelect, update: mockUpdate };
        }
        return { select: mockSelect };
      },
    }),
    __mocks: { mockSingle, mockUpdate, mockUpdateEq },
  };
});

vi.mock("@/lib/vapi/create-agent", () => ({
  createVapiAgent: vi.fn(),
}));

import { POST } from "./route";
import { auth } from "@clerk/nextjs/server";
import { createVapiAgent } from "@/lib/vapi/create-agent";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks } from "@/lib/supabase/server";

const { mockSingle, mockUpdateEq } = __mocks as {
  mockSingle: ReturnType<typeof vi.fn>;
  mockUpdateEq: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/dashboard/onboarding/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Request;
}

describe("POST /api/dashboard/onboarding/activate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as never);
    mockSingle.mockResolvedValue({
      data: { id: "shop_1", name: "Test Shop" },
      error: null,
    });
    mockUpdateEq.mockResolvedValue({ error: null });
    vi.mocked(createVapiAgent).mockResolvedValue({ id: "vapi_agent_123" });
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const res = await POST(makeRequest({ shopId: "shop_1", greeting: "Hi" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when shopId is missing", async () => {
    const res = await POST(makeRequest({ greeting: "Hi" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when shop not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    const res = await POST(makeRequest({ shopId: "shop_1", greeting: "Hi" }));
    expect(res.status).toBe(404);
  });

  it("creates vapi agent and activates successfully", async () => {
    const res = await POST(
      makeRequest({ shopId: "shop_1", greeting: "Welcome to my shop!" })
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ ok: true, agentId: "vapi_agent_123" });

    expect(createVapiAgent).toHaveBeenCalledWith({
      shopId: "shop_1",
      shopName: "Test Shop",
      greeting: "Welcome to my shop!",
    });
  });

  it("returns 500 when vapi agent creation fails", async () => {
    vi.mocked(createVapiAgent).mockRejectedValue(
      new Error("Failed to create Vapi agent: API error")
    );

    const res = await POST(
      makeRequest({ shopId: "shop_1", greeting: "Welcome!" })
    );
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toContain("Failed to create Vapi agent");
  });
});
