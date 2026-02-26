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
    __mocks: { mockSingle },
  };
});

import { POST } from "./route";
import { auth } from "@clerk/nextjs/server";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks } from "@/lib/supabase/server";

const { mockSingle } = __mocks as {
  mockSingle: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/dashboard/vapi-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Request;
}

describe("POST /api/dashboard/vapi-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as never);
    vi.stubEnv("VAPI_API_KEY", "test-api-key");
    mockSingle.mockResolvedValue({
      data: {
        id: "shop_1",
        name: "Fresh Cuts",
        greeting: "Welcome to Fresh Cuts!",
        timezone: "America/New_York",
      },
      error: null,
    });
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const res = await POST(makeRequest({ shopId: "shop_1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when shop not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    const res = await POST(makeRequest({ shopId: "shop_1" }));
    expect(res.status).toBe(404);
  });

  it("returns assistant config on success without apiKey", async () => {
    const res = await POST(makeRequest({ shopId: "shop_1" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.apiKey).toBeUndefined();
    expect(body.assistant.name).toBe("Fresh Cuts AI Receptionist");
    expect(body.assistant.firstMessage).toBe("Welcome to Fresh Cuts!");
    expect(body.assistant.metadata.shopId).toBe("shop_1");
  });

  it("never exposes VAPI_API_KEY in the response", async () => {
    const res = await POST(makeRequest({ shopId: "shop_1" }));
    const body = await res.json();
    const responseText = JSON.stringify(body);
    expect(responseText).not.toContain("test-api-key");
  });

  it("truncates shop name longer than 200 characters", async () => {
    const longName = "A".repeat(250);
    mockSingle.mockResolvedValue({
      data: {
        id: "shop_1",
        name: longName,
        greeting: "Hello!",
        timezone: "America/New_York",
      },
      error: null,
    });

    const res = await POST(makeRequest({ shopId: "shop_1" }));
    const body = await res.json();
    const nameInPrompt = body.assistant.model.messages[0].content;
    expect(nameInPrompt).not.toContain(longName);
    expect(body.assistant.name.length).toBeLessThanOrEqual(220); // 200 + " AI Receptionist"
  });

  it("truncates greeting longer than 1000 characters", async () => {
    const longGreeting = "G".repeat(1500);
    mockSingle.mockResolvedValue({
      data: {
        id: "shop_1",
        name: "Test Shop",
        greeting: longGreeting,
        timezone: "America/New_York",
      },
      error: null,
    });

    const res = await POST(makeRequest({ shopId: "shop_1" }));
    const body = await res.json();
    expect(body.assistant.firstMessage.length).toBeLessThanOrEqual(1000);
  });

  it("uses default greeting when shop greeting is null", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "shop_1",
        name: "Fresh Cuts",
        greeting: null,
        timezone: "America/Chicago",
      },
      error: null,
    });

    const res = await POST(makeRequest({ shopId: "shop_1" }));
    const body = await res.json();

    expect(body.assistant.firstMessage).toContain(
      "Hello! Thanks for calling"
    );
  });
});
