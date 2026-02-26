import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/vapi/validate", () => ({
  validateVapiRequest: vi.fn(),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockSingle },
  };
});

vi.mock("@/lib/square/client", () => ({
  createSquareClient: vi.fn(),
}));

vi.mock("@/lib/square/availability", () => ({
  searchAvailability: vi.fn().mockResolvedValue([]),
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

describe("POST /api/vapi/availability - shopId validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateVapiRequest).mockReturnValue(true);
  });

  it("rejects when parameter shopId does not match metadata shopId", async () => {
    const res = await POST(
      makeRequest({
        message: {
          functionCall: {
            parameters: {
              shopId: "attacker-shop",
              date: "2026-03-01",
            },
          },
          assistant: {
            metadata: { shopId: "real-shop" },
          },
        },
      })
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.results[0].result).toContain("mismatch");
  });

  it("uses metadata shopId when parameter shopId is missing", async () => {
    const res = await POST(
      makeRequest({
        message: {
          functionCall: {
            parameters: {
              date: "2026-03-01",
            },
          },
          assistant: {
            metadata: { shopId: "real-shop" },
          },
        },
      })
    );

    // Should not return 403 - should proceed with metadata shopId
    expect(res.status).not.toBe(403);
  });
});
