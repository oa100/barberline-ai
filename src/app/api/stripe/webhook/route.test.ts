import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockEq, mockUpdate, mockFrom } = vi.hoisted(() => {
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
  return { mockEq, mockUpdate, mockFrom };
});

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn().mockReturnValue({ from: mockFrom }),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

import { POST } from "./route";
import { stripe } from "@/lib/stripe";

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
  });

  it("returns 400 when signature verification fails", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "bad_sig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("updates subscription status on checkout.session.completed", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_123",
          subscription: "sub_123",
          metadata: {},
        },
      },
    } as never);

    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "valid_sig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_subscription_id: "sub_123",
        subscription_status: "active",
      })
    );
  });

  it("updates status on customer.subscription.updated", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_123",
          id: "sub_123",
          status: "past_due",
          current_period_end: 1700000000,
          trial_end: null,
          items: { data: [{ price: { id: "price_starter", metadata: {} }, metadata: {} }] },
          metadata: { tier: "starter" },
        },
      },
    } as never);

    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "valid_sig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_status: "past_due" })
    );
  });

  it("clears subscription on customer.subscription.deleted", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          customer: "cus_123",
          id: "sub_123",
        },
      },
    } as never);

    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "valid_sig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_status: "canceled",
        stripe_subscription_id: null,
        subscription_tier: null,
      })
    );
  });
});
