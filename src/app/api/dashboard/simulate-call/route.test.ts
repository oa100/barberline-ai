import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => {
  const mockServiceInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockServiceFrom = vi.fn().mockReturnValue({ insert: mockServiceInsert });
  return {
    createServiceClient: vi.fn().mockReturnValue({ from: mockServiceFrom }),
    __serviceMocks: { mockServiceInsert, mockServiceFrom },
  };
});

vi.mock("@/lib/supabase/server", () => {
  const mockSingle = vi.fn();
  const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
  const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
  const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === "call_logs") {
      return { insert: mockInsert };
    }
    return { select: mockSelect };
  });

  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockSingle, mockFrom, mockInsert },
  };
});

import { POST } from "./route";
import { auth } from "@clerk/nextjs/server";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks } from "@/lib/supabase/server";
// @ts-expect-error __serviceMocks injected by vi.mock
import { __serviceMocks } from "@/lib/supabase/service";

const { mockSingle, mockInsert } = __mocks as {
  mockSingle: ReturnType<typeof vi.fn>;
  mockInsert: ReturnType<typeof vi.fn>;
};

const { mockServiceInsert } = __serviceMocks as {
  mockServiceInsert: ReturnType<typeof vi.fn>;
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
    mockInsert.mockResolvedValue({ data: null, error: null });
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

  it("processes the end-of-call report directly without HTTP request", async () => {
    const res = await POST(makeRequest({ shopId: "shop_1" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toMatch(/Simulated call from .+ — (booked|info_only|no_availability)/);

    // Verify the call log was inserted directly via service client (no HTTP fetch)
    expect(mockServiceInsert).toHaveBeenCalled();
  });

  it("does not use Host header or make HTTP requests to itself", async () => {
    // Ensure global.fetch is not called (no self-HTTP request / no SSRF)
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await POST(makeRequest({ shopId: "shop_1" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("does not expose internal error details in responses", async () => {
    mockServiceInsert.mockRejectedValueOnce(new Error("DB connection failed"));

    const res = await POST(makeRequest({ shopId: "shop_1" }));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.detail).toBeUndefined();
    expect(body.error).toBe("Failed to process simulated call");
  });
});
