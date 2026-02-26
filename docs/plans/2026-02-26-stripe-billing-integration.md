# Stripe Billing Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Stripe-powered subscription billing with two plans (Starter $49/mo, Pro $99/mo), a 14-day free trial, and a dashboard billing page that replaces the current "coming soon" placeholder.

**Architecture:** Stripe Checkout for new subscriptions, Stripe Customer Portal for self-serve management (upgrade/downgrade/cancel), and a webhook endpoint to sync subscription state to Supabase. The `shops` table gets new columns for Stripe IDs and subscription status. No subscription gating in this phase — just billing plumbing and UI. Gating is a future task.

**Tech Stack:** `stripe` npm package, Stripe Checkout Sessions, Stripe Customer Portal, Stripe Webhooks, Supabase migrations, Next.js API routes, vitest.

---

## Context for the Implementer

**Codebase:** Next.js 16 app at `/Users/yemiadej/yprojects/claude/barberline-ai`. Uses Clerk for auth, Supabase for DB, Tailwind v4 with dark/gold theme (`bg-[#0A0A0A]`, `text-gold`, `text-cream`, `text-warm-gray`). Sharp edges (no border-radius). Tests use vitest + @testing-library/react. All API routes are in `src/app/api/`.

**Existing billing page:** `src/app/(dashboard)/dashboard/billing/page.tsx` — server component that calls `getAuthenticatedShop()` and shows a placeholder with "Free Trial" badge and two non-functional plan buttons.

**Existing pricing page:** `src/app/(marketing)/pricing/page.tsx` — static page with plan cards, "Get Started" buttons link to `/signup`.

**Auth helper:** `src/lib/dashboard/auth.ts` — `getAuthenticatedShop()` returns the shop row for the current Clerk user.

**Database:** Supabase. `shops` table has `id` (uuid), `clerk_user_id` (text), `name`, etc. No subscription fields yet. Migrations in `supabase/migrations/`.

**Env vars:** `.env.local.example` — no Stripe vars yet.

**Rate limiting:** `src/lib/rate-limit.ts` — `rateLimit(key, config)` returns `{ allowed, remaining }`. Use `rateLimitResponse()` for 429.

---

### Task 1: Install Stripe + Add Env Vars

**Files:**
- Modify: `package.json`
- Modify: `.env.local.example`

**Step 1: Install the Stripe SDK**

Run: `npm install stripe`

**Step 2: Add Stripe env vars to `.env.local.example`**

Add these lines after the `# Encryption` section:

```bash
# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
```

**Step 3: Create Stripe helper**

Create `src/lib/stripe.ts`:

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-18.acacia",
  typescript: true,
});
```

**Step 4: Commit**

```bash
git add package.json package-lock.json .env.local.example src/lib/stripe.ts
git commit -m "chore: install stripe SDK and add env vars"
```

---

### Task 2: Database Migration — Add Subscription Columns

**Files:**
- Create: `supabase/migrations/20260226100000_add_subscription_columns.sql`

**Step 1: Write the migration**

```sql
-- Add Stripe billing columns to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_tier text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- Index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_shops_stripe_customer_id ON shops(stripe_customer_id);
```

**Step 2: Apply locally**

Run: `npx supabase db push` (or apply manually if not using Supabase CLI locally — the migration file is the artifact).

**Step 3: Commit**

```bash
git add supabase/migrations/20260226100000_add_subscription_columns.sql
git commit -m "feat: add subscription columns to shops table"
```

---

### Task 3: Stripe Checkout Session API Route

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`
- Create: `src/app/api/stripe/checkout/route.test.ts`

**Step 1: Write the failing test**

Create `src/app/api/stripe/checkout/route.test.ts`:

```typescript
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
  rateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 4 }),
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
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_pro");
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

  it("returns checkout URL for valid tier", async () => {
    const req = new NextRequest("http://localhost/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ tier: "starter" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/session_test");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/stripe/checkout/route.test.ts`

Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `src/app/api/stripe/checkout/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(`checkout:${userId}`, { limit: 5, windowMs: 60_000 });
  if (!allowed) return rateLimitResponse();

  const body = await req.json();
  const tier = body.tier as string;
  const priceId = PRICE_IDS[tier];

  if (!priceId) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, stripe_customer_id, clerk_user_id")
    .eq("clerk_user_id", userId)
    .single();

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  // Reuse existing Stripe customer or create one
  let customerId = shop.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { clerk_user_id: userId, shop_id: shop.id },
    });
    customerId = customer.id;

    await supabase
      .from("shops")
      .update({ stripe_customer_id: customerId })
      .eq("id", shop.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { shop_id: shop.id, tier },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/stripe/checkout/route.test.ts`

Expected: PASS (3 tests).

**Step 5: Commit**

```bash
git add src/app/api/stripe/checkout/
git commit -m "feat: add Stripe checkout session API route"
```

---

### Task 4: Stripe Customer Portal API Route

**Files:**
- Create: `src/app/api/stripe/portal/route.ts`
- Create: `src/app/api/stripe/portal/route.test.ts`

**Step 1: Write the failing test**

Create `src/app/api/stripe/portal/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
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

vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: "https://billing.stripe.com/portal_test",
        }),
      },
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 4 }),
  rateLimitResponse: vi.fn(),
}));

import { POST } from "./route";
import { auth } from "@clerk/nextjs/server";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks as dbMocks } from "@/lib/supabase/server";

const { mockSingle } = dbMocks as { mockSingle: ReturnType<typeof vi.fn> };

describe("POST /api/stripe/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as never);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const req = new NextRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when no Stripe customer exists", async () => {
    mockSingle.mockResolvedValue({
      data: { stripe_customer_id: null },
      error: null,
    });
    const req = new NextRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns portal URL for existing customer", async () => {
    mockSingle.mockResolvedValue({
      data: { stripe_customer_id: "cus_test123" },
      error: null,
    });
    const req = new NextRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://billing.stripe.com/portal_test");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/stripe/portal/route.test.ts`

**Step 3: Write the implementation**

Create `src/app/api/stripe/portal/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(`portal:${userId}`, { limit: 5, windowMs: 60_000 });
  if (!allowed) return rateLimitResponse();

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("stripe_customer_id")
    .eq("clerk_user_id", userId)
    .single();

  if (!shop?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found. Please subscribe first." },
      { status: 400 }
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: shop.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/stripe/portal/route.test.ts`

Expected: PASS (3 tests).

**Step 5: Commit**

```bash
git add src/app/api/stripe/portal/
git commit -m "feat: add Stripe customer portal API route"
```

---

### Task 5: Stripe Webhook Handler

**Files:**
- Create: `src/app/api/stripe/webhook/route.ts`
- Create: `src/app/api/stripe/webhook/route.test.ts`

**Step 1: Write the failing test**

Create `src/app/api/stripe/webhook/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/stripe/webhook/route.test.ts`

**Step 3: Write the implementation**

Create `src/app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await supabase
        .from("shops")
        .update({
          stripe_subscription_id: session.subscription as string,
          subscription_status: "active",
        })
        .eq("stripe_customer_id", session.customer as string);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const tier = sub.metadata?.tier ?? null;
      await supabase
        .from("shops")
        .update({
          subscription_status: sub.status,
          subscription_tier: tier,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
          trial_ends_at: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
        })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("shops")
        .update({
          subscription_status: "canceled",
          stripe_subscription_id: null,
          subscription_tier: null,
        })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/stripe/webhook/route.test.ts`

Expected: PASS (4 tests).

**Step 5: Commit**

```bash
git add src/app/api/stripe/webhook/
git commit -m "feat: add Stripe webhook handler for subscription events"
```

---

### Task 6: Billing Page — Replace Placeholder with Real UI

**Files:**
- Modify: `src/app/(dashboard)/dashboard/billing/page.tsx`
- Create: `src/app/(dashboard)/dashboard/billing/checkout-button.tsx`
- Create: `src/app/(dashboard)/dashboard/billing/portal-button.tsx`
- Modify: `src/app/(dashboard)/dashboard/billing/billing.test.tsx`

**Step 1: Write the failing tests**

Replace `src/app/(dashboard)/dashboard/billing/billing.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/dashboard/auth", () => ({
  getAuthenticatedShop: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("radix-ui", () => ({
  Slot: {
    Root: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <span {...props}>{children}</span>,
  },
}));

import BillingPage from "./page";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";

describe("BillingPage", () => {
  it("renders billing heading", async () => {
    vi.mocked(getAuthenticatedShop).mockResolvedValue({
      id: "shop-1",
      name: "Test Shop",
      subscription_status: "trialing",
      subscription_tier: null,
      trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      stripe_customer_id: null,
    } as never);
    const Page = await BillingPage();
    render(Page);
    expect(screen.getByText("Billing")).toBeInTheDocument();
  });

  it("shows trial badge when trialing", async () => {
    vi.mocked(getAuthenticatedShop).mockResolvedValue({
      id: "shop-1",
      name: "Test Shop",
      subscription_status: "trialing",
      subscription_tier: null,
      trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      stripe_customer_id: null,
    } as never);
    const Page = await BillingPage();
    render(Page);
    expect(screen.getByText("Free Trial")).toBeInTheDocument();
  });

  it("shows active badge when subscribed", async () => {
    vi.mocked(getAuthenticatedShop).mockResolvedValue({
      id: "shop-1",
      name: "Test Shop",
      subscription_status: "active",
      subscription_tier: "pro",
      stripe_customer_id: "cus_123",
    } as never);
    const Page = await BillingPage();
    render(Page);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows plan cards when not subscribed", async () => {
    vi.mocked(getAuthenticatedShop).mockResolvedValue({
      id: "shop-1",
      name: "Test Shop",
      subscription_status: "trialing",
      subscription_tier: null,
      stripe_customer_id: null,
    } as never);
    const Page = await BillingPage();
    render(Page);
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("$99")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/(dashboard)/dashboard/billing/billing.test.tsx`

**Step 3: Create checkout button client component**

Create `src/app/(dashboard)/dashboard/billing/checkout-button.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButton({
  tier,
  label,
  variant = "default",
}: {
  tier: string;
  label: string;
  variant?: "default" | "outline";
}) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} onClick={handleCheckout} disabled={loading}>
      {loading ? "Redirecting…" : label}
    </Button>
  );
}
```

**Step 4: Create portal button client component**

Create `src/app/(dashboard)/dashboard/billing/portal-button.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handlePortal} disabled={loading}>
      {loading ? "Redirecting…" : "Manage Subscription"}
    </Button>
  );
}
```

**Step 5: Rewrite the billing page**

Replace `src/app/(dashboard)/dashboard/billing/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { CheckoutButton } from "./checkout-button";
import { PortalButton } from "./portal-button";

const plans = [
  {
    tier: "starter",
    name: "Starter",
    price: "$49",
    features: ["200 AI calls/mo", "Square booking", "SMS confirmations", "Call log", "Basic analytics"],
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$99",
    popular: true,
    features: [
      "All Starter features",
      "Unlimited calls",
      "Full analytics",
      "Custom voice/greeting",
      "Multi-barber routing",
      "Priority support",
    ],
  },
];

export default async function BillingPage() {
  const shop = await getAuthenticatedShop();

  if (!shop) {
    redirect("/dashboard/onboarding");
  }

  const status = shop.subscription_status ?? "trialing";
  const tier = shop.subscription_tier;
  const hasSubscription = shop.stripe_customer_id && status === "active";
  const isTrialing = status === "trialing";
  const trialDaysLeft = shop.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(shop.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 14;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan
            {isTrialing && <Badge variant="secondary">Free Trial</Badge>}
            {hasSubscription && tier && (
              <>
                <Badge>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Badge>
                <Badge variant="secondary">Active</Badge>
              </>
            )}
            {status === "past_due" && <Badge variant="destructive">Past Due</Badge>}
            {status === "canceled" && <Badge variant="destructive">Canceled</Badge>}
          </CardTitle>
          <CardDescription>
            {isTrialing
              ? `You have ${trialDaysLeft} days left on your free trial. Choose a plan to continue after your trial ends.`
              : hasSubscription
                ? "Your subscription is active. Manage your plan below."
                : "Choose a plan to get started."}
          </CardDescription>
        </CardHeader>
        {hasSubscription && (
          <CardContent>
            <PortalButton />
          </CardContent>
        )}
      </Card>

      {/* Plan Cards — show when no active subscription */}
      {!hasSubscription && (
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.tier} className={plan.popular ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.popular && <Badge>Most Popular</Badge>}
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <CheckoutButton
                  tier={plan.tier}
                  label={`Subscribe to ${plan.name}`}
                  variant={plan.popular ? "default" : "outline"}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 6: Run test to verify it passes**

Run: `npx vitest run src/app/(dashboard)/dashboard/billing/billing.test.tsx`

Expected: PASS (4 tests).

**Step 7: Commit**

```bash
git add src/app/(dashboard)/dashboard/billing/
git commit -m "feat: replace billing placeholder with Stripe checkout and portal UI"
```

---

### Task 7: Update Pricing Page CTAs

**Files:**
- Modify: `src/app/(marketing)/pricing/page.tsx`
- Modify: `src/app/(marketing)/pricing/pricing.test.tsx`

**Step 1: Update the pricing page**

The pricing page "Get Started" buttons currently link to `/signup`. For users who are already signed in, they should go to `/dashboard/billing`. Keep linking to `/signup` for now (signup → onboarding → billing is the natural flow), but add "14-day free trial" text.

In `src/app/(marketing)/pricing/page.tsx`, find the Button that says "Get Started" and add trial messaging. After the `</Button>` at line 111, add:

```tsx
<p className="mt-4 text-center text-xs text-warm-gray">
  14-day free trial. No credit card required to start.
</p>
```

**Step 2: Update test to check for trial text**

In `src/app/(marketing)/pricing/pricing.test.tsx`, add a test:

```typescript
it("shows free trial messaging", () => {
  render(<PricingPage />);
  expect(screen.getByText(/14-day free trial/)).toBeInTheDocument();
});
```

**Step 3: Run tests**

Run: `npx vitest run src/app/(marketing)/pricing/pricing.test.tsx`

Expected: PASS.

**Step 4: Commit**

```bash
git add src/app/(marketing)/pricing/
git commit -m "feat: add 14-day free trial messaging to pricing page"
```

---

### Task 8: Update Env Vars + Run Full Test Suite

**Step 1: Run the full test suite**

Run: `npx vitest run`

Expected: All tests pass.

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

**Step 3: Update roadmap**

In `docs/roadmap.md`, change:
```
- [ ] **Stripe billing integration** — Billing page says "coming soon." Can't charge customers without this. Plans: Starter ($49/mo), Pro ($99/mo). 14-day free trial.
```
to:
```
- [x] **Stripe billing integration** — Checkout, portal, webhooks, billing page. Plans: Starter ($49/mo), Pro ($99/mo). 14-day free trial.
```

**Step 4: Final commit**

```bash
git add docs/roadmap.md
git commit -m "docs: mark Stripe billing integration complete in roadmap"
```

---

## Post-Implementation: Stripe Dashboard Setup

After the code is deployed, the shop owner needs to:

1. **Create products in Stripe Dashboard:**
   - Product: "BarberLine AI Starter" → Price: $49/mo recurring
   - Product: "BarberLine AI Pro" → Price: $99/mo recurring

2. **Copy price IDs** into `.env.local`:
   - `STRIPE_STARTER_PRICE_ID=price_xxx`
   - `STRIPE_PRO_PRICE_ID=price_xxx`

3. **Set up webhook endpoint** in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

4. **Configure Customer Portal** in Stripe Dashboard:
   - Enable plan switching between Starter and Pro
   - Enable cancellation
   - Enable invoice history

5. **Run the Supabase migration** to add subscription columns.

---

## What This Plan Does NOT Include (Future Work)

- **Subscription gating** — Enforcing plan limits (200 calls/mo for Starter). Separate task.
- **Usage tracking** — Counting AI calls per billing period. Separate task.
- **Referral program** — $50 credit per referral. P2 backlog item.
- **Invoice emails** — Handled by Stripe automatically.
- **Proration** — Handled by Stripe automatically on plan changes.
