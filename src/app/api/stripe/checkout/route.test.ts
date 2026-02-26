import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  });
  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockFrom, mockSelect, mockEq, mockSingle, mockUpdate },
  };
});

vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: {
      create: vi.fn().mockResolvedValue({ id: "cus_test123" }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: "https://checkout.stripe.com/session_test",
        }),
      },
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 4 }),
  rateLimitResponse: vi.fn(),
}));

import { POST } from "./route";
import { auth } from "@clerk/nextjs/server";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks as dbMocks } from "@/lib/supabase/server";

const { mockSingle } = dbMocks as { mockSingle: ReturnType<typeof vi.fn> };

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as never);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("STRIPE_STARTER_PRICE_ID", "price_starter");
    vi.stubEnv("STRIPE_STARTER_ANNUAL_PRICE_ID", "price_starter_annual");
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_pro");
    vi.stubEnv("STRIPE_PRO_ANNUAL_PRICE_ID", "price_pro_annual");
    mockSingle.mockResolvedValue({
      data: { id: "shop-1", name: "Test Shop", clerk_user_id: "user_123", stripe_customer_id: null },
      error: null,
    });
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const req = new NextRequest("http://localhost/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ tier: "starter" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid tier", async () => {
    const req = new NextRequest("http://localhost/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ tier: "enterprise" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns checkout URL for valid tier (monthly default)", async () => {
    const req = new NextRequest("http://localhost/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ tier: "starter" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/session_test");
  });

  it("returns checkout URL for annual interval", async () => {
    const req = new NextRequest("http://localhost/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ tier: "pro", interval: "annual" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/session_test");
  });
});
