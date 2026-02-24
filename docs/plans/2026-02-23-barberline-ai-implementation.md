# BarberLine AI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI voice agent that answers barbershop calls, books appointments via Square, with a barber dashboard and marketing site.

**Architecture:** Single Next.js App Router monorepo on Vercel. Vapi handles voice calls and triggers API routes for Square availability/booking. Supabase stores shops, call logs, and bookings. Clerk handles auth. Marketing site and dashboard are route groups in the same app.

**Tech Stack:** Next.js 15, TypeScript, Vapi, Square Bookings API, Supabase, Clerk, Twilio, shadcn/ui, Tailwind CSS, Recharts, TanStack Table

**Design doc:** `docs/plans/2026-02-23-barberline-ai-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local.example`, `.gitignore`
- Create: `app/layout.tsx`, `app/page.tsx`
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`

**Step 1: Initialize Next.js project**

```bash
cd /Users/yemiadej/yprojects/claude/barberline-ai
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Accept defaults. This creates the base Next.js project with App Router and Tailwind.

**Step 2: Install core dependencies**

```bash
npm install @supabase/supabase-js @clerk/nextjs @vapi-ai/server-sdk square twilio
npm install @tanstack/react-table recharts
npm install -D supabase
```

**Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button card input label table tabs badge dialog sheet separator dropdown-menu avatar skeleton toast
```

**Step 4: Create environment template**

Create `.env.local.example`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup

# Vapi
VAPI_API_KEY=
VAPI_SERVER_SECRET=

# Square
SQUARE_APPLICATION_ID=
SQUARE_ACCESS_TOKEN=
SQUARE_ENVIRONMENT=sandbox

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

**Step 5: Create Supabase client helpers**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

**Step 6: Install Supabase SSR helper**

```bash
npm install @supabase/ssr
```

**Step 7: Set up Clerk middleware**

Create `middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**Step 8: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js project with core dependencies"
```

---

## Task 2: Database Schema (Supabase Migrations)

**Files:**
- Create: `supabase/migrations/00001_create_tables.sql`
- Create: `lib/supabase/types.ts`

**Step 1: Initialize Supabase locally**

```bash
npx supabase init
```

**Step 2: Write the migration**

Create `supabase/migrations/00001_create_tables.sql`:
```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Outcome enum for call logs
create type call_outcome as enum (
  'booked',
  'no_availability',
  'fallback',
  'hangup',
  'info_only'
);

-- Booking status enum
create type booking_status as enum (
  'confirmed',
  'cancelled',
  'no_show'
);

-- Shops table
create table shops (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text not null unique,
  name text not null,
  phone_number text,
  square_token text,
  square_location text,
  vapi_agent_id text,
  timezone text not null default 'America/Chicago',
  greeting text,
  created_at timestamptz not null default now()
);

-- Team members table
create table team_members (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  square_member_id text,
  name text not null,
  active boolean not null default true
);

-- Call logs table
create table call_logs (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  vapi_call_id text,
  caller_phone text,
  duration_sec integer,
  outcome call_outcome not null,
  transcript jsonb,
  created_at timestamptz not null default now()
);

-- Bookings table
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  call_log_id uuid references call_logs(id),
  square_booking_id text,
  customer_name text not null,
  customer_phone text,
  team_member_id uuid references team_members(id),
  service text not null,
  start_time timestamptz not null,
  status booking_status not null default 'confirmed',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_call_logs_shop_id on call_logs(shop_id);
create index idx_call_logs_created_at on call_logs(created_at desc);
create index idx_bookings_shop_id on bookings(shop_id);
create index idx_bookings_start_time on bookings(start_time);
create index idx_team_members_shop_id on team_members(shop_id);

-- Row Level Security
alter table shops enable row level security;
alter table team_members enable row level security;
alter table call_logs enable row level security;
alter table bookings enable row level security;

-- RLS policies (service role bypasses these; API routes use service role)
-- Dashboard access uses Clerk user ID passed from API routes
```

**Step 3: Generate TypeScript types**

Create `lib/supabase/types.ts`:
```typescript
export type CallOutcome =
  | "booked"
  | "no_availability"
  | "fallback"
  | "hangup"
  | "info_only";

export type BookingStatus = "confirmed" | "cancelled" | "no_show";

export interface Shop {
  id: string;
  clerk_user_id: string;
  name: string;
  phone_number: string | null;
  square_token: string | null;
  square_location: string | null;
  vapi_agent_id: string | null;
  timezone: string;
  greeting: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  shop_id: string;
  square_member_id: string | null;
  name: string;
  active: boolean;
}

export interface CallLog {
  id: string;
  shop_id: string;
  vapi_call_id: string | null;
  caller_phone: string | null;
  duration_sec: number | null;
  outcome: CallOutcome;
  transcript: Record<string, unknown> | null;
  created_at: string;
}

export interface Booking {
  id: string;
  shop_id: string;
  call_log_id: string | null;
  square_booking_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  team_member_id: string | null;
  service: string;
  start_time: string;
  status: BookingStatus;
  created_at: string;
}
```

**Step 4: Commit**

```bash
git add supabase/ lib/supabase/types.ts
git commit -m "feat: add database schema and TypeScript types"
```

---

## Task 3: Square Integration Library

**Files:**
- Create: `lib/square/client.ts`
- Create: `lib/square/availability.ts`
- Create: `lib/square/booking.ts`
- Create: `lib/square/catalog.ts`

**Step 1: Create Square client factory**

Create `lib/square/client.ts`:
```typescript
import { Client, Environment } from "square";

export function createSquareClient(accessToken: string): Client {
  return new Client({
    accessToken,
    environment:
      process.env.SQUARE_ENVIRONMENT === "production"
        ? Environment.Production
        : Environment.Sandbox,
  });
}
```

**Step 2: Create availability module**

Create `lib/square/availability.ts`:
```typescript
import { Client } from "square";

interface AvailabilityParams {
  locationId: string;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  serviceVariationId?: string;
  teamMemberId?: string;
}

interface TimeSlot {
  startAt: string;
  teamMemberId?: string;
  serviceVariationId: string;
  locationId: string;
}

export async function searchAvailability(
  client: Client,
  params: AvailabilityParams
): Promise<TimeSlot[]> {
  const { result } = await client.bookingsApi.searchAvailability({
    query: {
      filter: {
        startAtRange: {
          startAt: params.startDate,
          endAt: params.endDate,
        },
        locationId: params.locationId,
        segmentFilters: [
          {
            serviceVariationId: params.serviceVariationId || "",
            teamMemberIdFilter: params.teamMemberId
              ? { any: [params.teamMemberId] }
              : undefined,
          },
        ],
      },
    },
  });

  return (result.availabilities || []).map((a) => ({
    startAt: a.startAt!,
    teamMemberId: a.appointmentSegments?.[0]?.teamMemberId,
    serviceVariationId: a.appointmentSegments?.[0]?.serviceVariationId || "",
    locationId: params.locationId,
  }));
}
```

**Step 3: Create booking module**

Create `lib/square/booking.ts`:
```typescript
import { Client } from "square";
import { randomUUID } from "crypto";

interface CreateBookingParams {
  locationId: string;
  startAt: string;
  customerName: string;
  customerPhone: string;
  serviceVariationId: string;
  teamMemberId?: string;
  durationMinutes?: number;
}

export async function createBooking(
  client: Client,
  params: CreateBookingParams
) {
  const { result } = await client.bookingsApi.createBooking({
    idempotencyKey: randomUUID(),
    booking: {
      locationId: params.locationId,
      startAt: params.startAt,
      appointmentSegments: [
        {
          serviceVariationId: params.serviceVariationId,
          teamMemberId: params.teamMemberId || "",
          durationMinutes: params.durationMinutes
            ? BigInt(params.durationMinutes)
            : undefined,
        },
      ],
      customerNote: `Booked by AI for ${params.customerName} (${params.customerPhone})`,
    },
  });

  return result.booking;
}

export async function cancelBooking(
  client: Client,
  bookingId: string,
  bookingVersion: number
) {
  const { result } = await client.bookingsApi.cancelBooking(bookingId, {
    bookingVersion,
  });
  return result.booking;
}
```

**Step 4: Create catalog module**

Create `lib/square/catalog.ts`:
```typescript
import { Client } from "square";

interface ServiceInfo {
  id: string;
  name: string;
  durationMinutes: number;
  priceAmount: number;
  priceCurrency: string;
}

export async function listServices(
  client: Client,
  locationId: string
): Promise<ServiceInfo[]> {
  const { result } = await client.catalogApi.searchCatalogItems({
    enabledLocationIds: [locationId],
    productTypes: ["APPOINTMENTS_SERVICE"],
  });

  return (result.items || []).flatMap((item) =>
    (item.itemData?.variations || []).map((v) => ({
      id: v.id!,
      name: `${item.itemData?.name} - ${v.itemData?.name}`,
      durationMinutes: Number(
        v.itemData?.serviceDuration
          ? BigInt(v.itemData.serviceDuration) / BigInt(60000)
          : 30
      ),
      priceAmount: Number(v.itemData?.priceMoney?.amount || 0) / 100,
      priceCurrency: v.itemData?.priceMoney?.currency || "USD",
    }))
  );
}

export async function getBusinessHours(
  client: Client,
  locationId: string
) {
  const { result } = await client.locationsApi.retrieveLocation(locationId);
  return result.location?.businessHours?.periods || [];
}
```

**Step 5: Commit**

```bash
git add lib/square/
git commit -m "feat: add Square API integration library"
```

---

## Task 4: Vapi Webhook API Routes

**Files:**
- Create: `lib/vapi/validate.ts`
- Create: `app/api/vapi/availability/route.ts`
- Create: `app/api/vapi/book/route.ts`
- Create: `app/api/vapi/info/route.ts`
- Create: `app/api/vapi/message/route.ts`
- Create: `app/api/vapi/webhook/route.ts`

**Step 1: Create Vapi request validation helper**

Create `lib/vapi/validate.ts`:
```typescript
import { NextRequest } from "next/server";

export function validateVapiRequest(req: NextRequest): boolean {
  const secret = req.headers.get("x-vapi-secret");
  return secret === process.env.VAPI_SERVER_SECRET;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Step 2: Create availability route**

Create `app/api/vapi/availability/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { validateVapiRequest, unauthorizedResponse } from "@/lib/vapi/validate";
import { createSquareClient } from "@/lib/square/client";
import { searchAvailability } from "@/lib/square/availability";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) return unauthorizedResponse();

  const body = await req.json();
  const { shopId, date, teamMemberId } = body.message?.functionCall?.parameters || {};

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("square_token, square_location")
    .eq("id", shopId)
    .single();

  if (!shop?.square_token || !shop?.square_location) {
    return Response.json({
      results: [{ result: "Sorry, I'm unable to check availability right now." }],
    });
  }

  const client = createSquareClient(shop.square_token);

  const startDate = new Date(date || Date.now());
  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59);

  const slots = await searchAvailability(client, {
    locationId: shop.square_location,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    teamMemberId,
  });

  const topSlots = slots.slice(0, 3).map((s) => {
    const d = new Date(s.startAt);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  });

  return Response.json({
    results: [
      {
        result:
          topSlots.length > 0
            ? `Available times: ${topSlots.join(", ")}`
            : "No availability on that date. Want me to check another day?",
        availableSlots: slots.slice(0, 3),
      },
    ],
  });
}
```

**Step 3: Create booking route**

Create `app/api/vapi/book/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { validateVapiRequest, unauthorizedResponse } from "@/lib/vapi/validate";
import { createSquareClient } from "@/lib/square/client";
import { createBooking } from "@/lib/square/booking";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) return unauthorizedResponse();

  const body = await req.json();
  const {
    shopId,
    startAt,
    customerName,
    customerPhone,
    serviceVariationId,
    teamMemberId,
  } = body.message?.functionCall?.parameters || {};

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("square_token, square_location")
    .eq("id", shopId)
    .single();

  if (!shop?.square_token || !shop?.square_location) {
    return Response.json({
      results: [{ result: "Sorry, I'm unable to book right now. Let me take a message instead." }],
    });
  }

  try {
    const client = createSquareClient(shop.square_token);
    const booking = await createBooking(client, {
      locationId: shop.square_location,
      startAt,
      customerName,
      customerPhone,
      serviceVariationId,
      teamMemberId,
    });

    // Save booking to Supabase
    await supabase.from("bookings").insert({
      shop_id: shopId,
      square_booking_id: booking?.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      team_member_id: teamMemberId || null,
      service: serviceVariationId,
      start_time: startAt,
    });

    // Send SMS confirmation
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: customerPhone,
        shopId,
        startAt,
        customerName,
      }),
    });

    const time = new Date(startAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const date = new Date(startAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    return Response.json({
      results: [
        {
          result: `You're all set! Booked for ${time} on ${date}. A confirmation text is on its way.`,
        },
      ],
    });
  } catch (error) {
    console.error("Booking error:", error);
    return Response.json({
      results: [
        {
          result: "Sorry, something went wrong booking that time. Want to try a different slot?",
        },
      ],
    });
  }
}
```

**Step 4: Create info route**

Create `app/api/vapi/info/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { validateVapiRequest, unauthorizedResponse } from "@/lib/vapi/validate";
import { createSquareClient } from "@/lib/square/client";
import { listServices, getBusinessHours } from "@/lib/square/catalog";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) return unauthorizedResponse();

  const body = await req.json();
  const { shopId, question } = body.message?.functionCall?.parameters || {};

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .single();

  if (!shop?.square_token || !shop?.square_location) {
    return Response.json({
      results: [{ result: "I don't have that information right now." }],
    });
  }

  const client = createSquareClient(shop.square_token);
  const [services, hours] = await Promise.all([
    listServices(client, shop.square_location),
    getBusinessHours(client, shop.square_location),
  ]);

  const serviceList = services
    .map((s) => `${s.name}: $${s.priceAmount} (${s.durationMinutes} min)`)
    .join("; ");

  const hoursList = hours
    .map(
      (h) =>
        `${h.dayOfWeek}: ${h.startLocalTime} - ${h.endLocalTime}`
    )
    .join("; ");

  return Response.json({
    results: [
      {
        result: `Services: ${serviceList}. Hours: ${hoursList}.`,
        services,
        hours,
      },
    ],
  });
}
```

**Step 5: Create message route**

Create `app/api/vapi/message/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { validateVapiRequest, unauthorizedResponse } from "@/lib/vapi/validate";
import { createClient } from "@/lib/supabase/server";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) return unauthorizedResponse();

  const body = await req.json();
  const { shopId, callerPhone, message } =
    body.message?.functionCall?.parameters || {};

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("name, phone_number")
    .eq("id", shopId)
    .single();

  // SMS the barber with the message
  if (shop?.phone_number) {
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await twilioClient.messages.create({
      body: `Message from ${callerPhone || "a caller"}: ${message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: shop.phone_number,
    });
  }

  return Response.json({
    results: [
      {
        result:
          "I've passed your message along. The barber will get back to you soon!",
      },
    ],
  });
}
```

**Step 6: Create post-call webhook route**

Create `app/api/vapi/webhook/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { validateVapiRequest, unauthorizedResponse } from "@/lib/vapi/validate";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) return unauthorizedResponse();

  const body = await req.json();
  const { message } = body;

  if (message?.type !== "end-of-call-report") {
    return Response.json({ ok: true });
  }

  const supabase = await createClient();

  // Determine outcome from call summary
  const transcript = message.transcript || [];
  const summary = message.summary || "";
  let outcome: string = "info_only";

  if (summary.toLowerCase().includes("booked") || summary.toLowerCase().includes("appointment")) {
    outcome = "booked";
  } else if (summary.toLowerCase().includes("no availability")) {
    outcome = "no_availability";
  } else if (summary.toLowerCase().includes("message")) {
    outcome = "fallback";
  } else if (message.endedReason === "customer-ended-call") {
    outcome = "hangup";
  }

  // Extract shop ID from assistant metadata
  const shopId = message.assistant?.metadata?.shopId;

  if (shopId) {
    await supabase.from("call_logs").insert({
      shop_id: shopId,
      vapi_call_id: message.callId,
      caller_phone: message.customer?.number || null,
      duration_sec: Math.round((message.durationSeconds || 0)),
      outcome,
      transcript: { messages: transcript, summary },
    });
  }

  return Response.json({ ok: true });
}
```

**Step 7: Commit**

```bash
git add lib/vapi/ app/api/vapi/
git commit -m "feat: add Vapi webhook API routes for voice agent"
```

---

## Task 5: Square OAuth & Twilio SMS Routes

**Files:**
- Create: `app/api/square/oauth/route.ts`
- Create: `app/api/square/callback/route.ts`
- Create: `app/api/twilio/send/route.ts`

**Step 1: Create Square OAuth initiation route**

Create `app/api/square/oauth/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const state = randomUUID();
  const baseUrl =
    process.env.SQUARE_ENVIRONMENT === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  const params = new URLSearchParams({
    client_id: process.env.SQUARE_APPLICATION_ID!,
    scope: "APPOINTMENTS_READ APPOINTMENTS_WRITE ITEMS_READ MERCHANT_PROFILE_READ",
    session: "false",
    state,
  });

  const redirectUrl = `${baseUrl}/oauth2/authorize?${params}`;

  return Response.redirect(redirectUrl);
}
```

**Step 2: Create Square OAuth callback route**

Create `app/api/square/callback/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Client, Environment } from "square";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.redirect("/sign-in");

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return Response.redirect("/dashboard/settings/integrations?error=no_code");

  const client = new Client({
    environment:
      process.env.SQUARE_ENVIRONMENT === "production"
        ? Environment.Production
        : Environment.Sandbox,
  });

  try {
    const { result } = await client.oAuthApi.obtainToken({
      clientId: process.env.SQUARE_APPLICATION_ID!,
      clientSecret: process.env.SQUARE_ACCESS_TOKEN!,
      grantType: "authorization_code",
      code,
    });

    const supabase = await createClient();

    // Get first location
    const squareClient = new Client({
      accessToken: result.accessToken!,
      environment:
        process.env.SQUARE_ENVIRONMENT === "production"
          ? Environment.Production
          : Environment.Sandbox,
    });
    const { result: locResult } = await squareClient.locationsApi.listLocations();
    const location = locResult.locations?.[0];

    await supabase
      .from("shops")
      .update({
        square_token: result.accessToken,
        square_location: location?.id || null,
      })
      .eq("clerk_user_id", userId);

    return Response.redirect(
      new URL("/dashboard/settings/integrations?success=true", req.url)
    );
  } catch (error) {
    console.error("Square OAuth error:", error);
    return Response.redirect(
      new URL("/dashboard/settings/integrations?error=oauth_failed", req.url)
    );
  }
}
```

**Step 3: Create Twilio SMS route**

Create `app/api/twilio/send/route.ts`:
```typescript
import { NextRequest } from "next/server";
import twilio from "twilio";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { to, shopId, startAt, customerName } = await req.json();

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("name")
    .eq("id", shopId)
    .single();

  const time = new Date(startAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const date = new Date(startAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await twilioClient.messages.create({
    body: `Hi ${customerName}! Your appointment at ${shop?.name || "the shop"} is confirmed for ${time} on ${date}. See you then!`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });

  return Response.json({ ok: true });
}
```

**Step 4: Commit**

```bash
git add app/api/square/ app/api/twilio/
git commit -m "feat: add Square OAuth and Twilio SMS routes"
```

---

## Task 6: Dashboard API Routes

**Files:**
- Create: `app/api/dashboard/calls/route.ts`
- Create: `app/api/dashboard/analytics/route.ts`
- Create: `app/api/dashboard/settings/route.ts`
- Create: `app/api/dashboard/shop/route.ts`
- Create: `lib/dashboard/auth.ts`

**Step 1: Create dashboard auth helper**

Create `lib/dashboard/auth.ts`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedShop() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  return shop;
}
```

**Step 2: Create calls route**

Create `app/api/dashboard/calls/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const shop = await getAuthenticatedShop();
  if (!shop) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const supabase = await createClient();
  const { data: calls, count } = await supabase
    .from("call_logs")
    .select("*", { count: "exact" })
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return Response.json({ calls: calls || [], total: count || 0, page, limit });
}
```

**Step 3: Create analytics route**

Create `app/api/dashboard/analytics/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const shop = await getAuthenticatedShop();
  if (!shop) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const supabase = await createClient();

  const { data: calls } = await supabase
    .from("call_logs")
    .select("outcome, created_at, duration_sec")
    .eq("shop_id", shop.id)
    .gte("created_at", since.toISOString());

  const totalCalls = calls?.length || 0;
  const booked = calls?.filter((c) => c.outcome === "booked").length || 0;
  const conversionRate = totalCalls > 0 ? Math.round((booked / totalCalls) * 100) : 0;
  const avgDuration =
    totalCalls > 0
      ? Math.round(
          (calls?.reduce((sum, c) => sum + (c.duration_sec || 0), 0) || 0) /
            totalCalls
        )
      : 0;

  // Group by date for chart
  const byDate: Record<string, { total: number; booked: number }> = {};
  calls?.forEach((c) => {
    const date = c.created_at.split("T")[0];
    if (!byDate[date]) byDate[date] = { total: 0, booked: 0 };
    byDate[date].total++;
    if (c.outcome === "booked") byDate[date].booked++;
  });

  // Group by hour for peak hours
  const byHour: Record<number, number> = {};
  calls?.forEach((c) => {
    const hour = new Date(c.created_at).getHours();
    byHour[hour] = (byHour[hour] || 0) + 1;
  });

  return Response.json({
    totalCalls,
    booked,
    conversionRate,
    avgDuration,
    byDate: Object.entries(byDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    byHour: Object.entries(byHour)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour),
  });
}
```

**Step 4: Create settings route**

Create `app/api/dashboard/settings/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const shop = await getAuthenticatedShop();
  if (!shop) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    name: shop.name,
    timezone: shop.timezone,
    greeting: shop.greeting,
    hasSquare: !!shop.square_token,
    hasVapi: !!shop.vapi_agent_id,
    phoneNumber: shop.phone_number,
  });
}

export async function PUT(req: NextRequest) {
  const shop = await getAuthenticatedShop();
  if (!shop) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await req.json();
  const allowed = ["name", "timezone", "greeting"];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("shops")
    .update(filtered)
    .eq("id", shop.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
```

**Step 5: Create shop route**

Create `app/api/dashboard/shop/route.ts`:
```typescript
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const shop = await getAuthenticatedShop();
  if (!shop) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(shop);
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();

  // Check if shop already exists
  const { data: existing } = await supabase
    .from("shops")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (existing) return Response.json(existing);

  const { data: shop, error } = await supabase
    .from("shops")
    .insert({ clerk_user_id: userId, name: "My Barbershop" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(shop);
}
```

**Step 6: Commit**

```bash
git add lib/dashboard/ app/api/dashboard/
git commit -m "feat: add dashboard API routes"
```

---

## Task 7: Dashboard Layout & Overview Page

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/page.tsx`
- Create: `components/dashboard/sidebar.tsx`
- Create: `components/dashboard/stat-card.tsx`

**Step 1: Create sidebar component**

Create `components/dashboard/sidebar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Phone,
  BarChart3,
  Settings,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/calls", label: "Calls", icon: Phone },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold">
          BarberLine AI
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  );
}
```

**Step 2: Install lucide-react**

```bash
npm install lucide-react
```

**Step 3: Create stat card component**

Create `components/dashboard/stat-card.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Create dashboard layout**

Create `app/(dashboard)/layout.tsx`:
```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </ClerkProvider>
  );
}
```

**Step 5: Create overview page**

Create `app/(dashboard)/page.tsx`:
```tsx
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const shop = await getAuthenticatedShop();
  if (!shop) redirect("/signup");

  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayCalls, count: totalToday } = await supabase
    .from("call_logs")
    .select("outcome", { count: "exact" })
    .eq("shop_id", shop.id)
    .gte("created_at", today.toISOString());

  const bookedToday =
    todayCalls?.filter((c) => c.outcome === "booked").length || 0;

  const { count: totalBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .eq("status", "confirmed")
    .gte("start_time", today.toISOString());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome back, {shop.name}</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Calls Today"
          value={totalToday || 0}
          description="Total inbound calls"
        />
        <StatCard
          title="Booked Today"
          value={bookedToday}
          description="Appointments booked by AI"
        />
        <StatCard
          title="Upcoming"
          value={totalBookings || 0}
          description="Confirmed appointments ahead"
        />
      </div>
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add app/\(dashboard\)/ components/dashboard/
git commit -m "feat: add dashboard layout with sidebar and overview page"
```

---

## Task 8: Dashboard — Calls Page

**Files:**
- Create: `app/(dashboard)/calls/page.tsx`
- Create: `components/dashboard/call-table.tsx`

**Step 1: Create call table component**

Create `components/dashboard/call-table.tsx`:
```tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { CallLog } from "@/lib/supabase/types";

const outcomeBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  booked: { label: "Booked", variant: "default" },
  no_availability: { label: "No Availability", variant: "secondary" },
  fallback: { label: "Message Taken", variant: "outline" },
  hangup: { label: "Hung Up", variant: "destructive" },
  info_only: { label: "Info", variant: "secondary" },
};

export function CallTable({ calls }: { calls: CallLog[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Time</TableHead>
          <TableHead>Caller</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Outcome</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.map((call) => (
          <>
            <TableRow
              key={call.id}
              className="cursor-pointer"
              onClick={() =>
                setExpandedId(expandedId === call.id ? null : call.id)
              }
            >
              <TableCell>
                {expandedId === call.id ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </TableCell>
              <TableCell>
                {new Date(call.created_at).toLocaleString()}
              </TableCell>
              <TableCell>{call.caller_phone || "Unknown"}</TableCell>
              <TableCell>
                {call.duration_sec
                  ? `${Math.floor(call.duration_sec / 60)}:${String(
                      call.duration_sec % 60
                    ).padStart(2, "0")}`
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={outcomeBadge[call.outcome]?.variant || "secondary"}>
                  {outcomeBadge[call.outcome]?.label || call.outcome}
                </Badge>
              </TableCell>
            </TableRow>
            {expandedId === call.id && call.transcript && (
              <TableRow key={`${call.id}-transcript`}>
                <TableCell colSpan={5} className="bg-muted/50 p-4">
                  <p className="text-sm font-medium mb-2">Transcript</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {(call.transcript as { summary?: string })?.summary ||
                      "No transcript available"}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
        {calls.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No calls yet. Once your AI agent is live, calls will appear here.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
```

**Step 2: Create calls page**

Create `app/(dashboard)/calls/page.tsx`:
```tsx
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { createClient } from "@/lib/supabase/server";
import { CallTable } from "@/components/dashboard/call-table";
import { redirect } from "next/navigation";

export default async function CallsPage() {
  const shop = await getAuthenticatedShop();
  if (!shop) redirect("/signup");

  const supabase = await createClient();
  const { data: calls } = await supabase
    .from("call_logs")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Call Log</h1>
      <CallTable calls={calls || []} />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/\(dashboard\)/calls/ components/dashboard/call-table.tsx
git commit -m "feat: add calls page with expandable transcript table"
```

---

## Task 9: Dashboard — Analytics Page

**Files:**
- Create: `app/(dashboard)/analytics/page.tsx`
- Create: `components/dashboard/charts.tsx`

**Step 1: Create chart components**

Create `components/dashboard/charts.tsx`:
```tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyData {
  date: string;
  total: number;
  booked: number;
}

interface HourlyData {
  hour: number;
  count: number;
}

export function CallVolumeChart({ data }: { data: DailyData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="total" fill="hsl(var(--muted-foreground))" name="Total Calls" />
            <Bar dataKey="booked" fill="hsl(var(--primary))" name="Booked" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PeakHoursChart({ data }: { data: HourlyData[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: `${d.hour % 12 || 12}${d.hour < 12 ? "am" : "pm"}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Calls"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create analytics page**

Create `app/(dashboard)/analytics/page.tsx`:
```tsx
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { CallVolumeChart, PeakHoursChart } from "@/components/dashboard/charts";
import { redirect } from "next/navigation";

async function getAnalytics(shopId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/analytics?days=30`,
    { cache: "no-store" }
  );
  return res.json();
}

export default async function AnalyticsPage() {
  const shop = await getAuthenticatedShop();
  if (!shop) redirect("/signup");

  const analytics = await getAnalytics(shop.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Calls" value={analytics.totalCalls} description="Last 30 days" />
        <StatCard title="Booked" value={analytics.booked} description="Appointments made" />
        <StatCard
          title="Conversion Rate"
          value={`${analytics.conversionRate}%`}
          description="Calls → bookings"
        />
        <StatCard
          title="Avg Duration"
          value={`${Math.floor(analytics.avgDuration / 60)}:${String(analytics.avgDuration % 60).padStart(2, "0")}`}
          description="Per call"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CallVolumeChart data={analytics.byDate} />
        <PeakHoursChart data={analytics.byHour} />
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/\(dashboard\)/analytics/ components/dashboard/charts.tsx
git commit -m "feat: add analytics page with call volume and peak hours charts"
```

---

## Task 10: Dashboard — Settings Pages

**Files:**
- Create: `app/(dashboard)/settings/page.tsx`
- Create: `app/(dashboard)/settings/voice/page.tsx`
- Create: `app/(dashboard)/settings/integrations/page.tsx`
- Create: `components/dashboard/settings-form.tsx`

**Step 1: Create settings form component**

Create `components/dashboard/settings-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsFormProps {
  initialData: {
    name: string;
    timezone: string;
    greeting: string | null;
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/dashboard/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Shop Name</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={data.timezone}
            onChange={(e) => setData({ ...data, timezone: e.target.value })}
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create settings page**

Create `app/(dashboard)/settings/page.tsx`:
```tsx
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const shop = await getAuthenticatedShop();
  if (!shop) redirect("/signup");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <SettingsForm
        initialData={{
          name: shop.name,
          timezone: shop.timezone,
          greeting: shop.greeting,
        }}
      />
    </div>
  );
}
```

**Step 3: Create voice settings page**

Create `app/(dashboard)/settings/voice/page.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VoiceSettingsPage() {
  const [greeting, setGreeting] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/settings")
      .then((r) => r.json())
      .then((d) => setGreeting(d.greeting || ""));
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/dashboard/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ greeting }),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Voice Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>AI Greeting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="greeting">
              Customize how your AI answers the phone
            </Label>
            <textarea
              id="greeting"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Thanks for calling [Shop Name]! I can help you book an appointment..."
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Greeting"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4: Create integrations page**

Create `app/(dashboard)/settings/integrations/page.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<{
    hasSquare: boolean;
    hasVapi: boolean;
    phoneNumber: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Integrations</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Square Appointments</CardTitle>
          <Badge variant={settings.hasSquare ? "default" : "destructive"}>
            {settings.hasSquare ? "Connected" : "Not Connected"}
          </Badge>
        </CardHeader>
        <CardContent>
          {settings.hasSquare ? (
            <p className="text-sm text-muted-foreground">
              Your Square account is connected. Availability and bookings sync automatically.
            </p>
          ) : (
            <Button asChild>
              <a href="/api/square/oauth">Connect Square</a>
            </Button>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI Phone Line</CardTitle>
          <Badge variant={settings.hasVapi ? "default" : "secondary"}>
            {settings.hasVapi ? "Active" : "Not Set Up"}
          </Badge>
        </CardHeader>
        <CardContent>
          {settings.phoneNumber ? (
            <p className="text-sm text-muted-foreground">
              Your AI answers calls at: <strong>{settings.phoneNumber}</strong>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Phone number will be assigned during setup.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add app/\(dashboard\)/settings/ components/dashboard/settings-form.tsx
git commit -m "feat: add settings pages for profile, voice, and integrations"
```

---

## Task 11: Marketing Site — Landing Page

**Files:**
- Create: `app/(marketing)/layout.tsx`
- Create: `app/(marketing)/page.tsx`
- Create: `components/marketing/header.tsx`
- Create: `components/marketing/footer.tsx`

**Step 1: Create marketing header**

Create `components/marketing/header.tsx`:
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          BarberLine AI
        </Link>
        <nav className="hidden gap-6 md:flex">
          <Link href="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            How It Works
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Create marketing footer**

Create `components/marketing/footer.tsx`:
```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="#">About</Link></li>
              <li><Link href="#">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="#">Privacy</Link></li>
              <li><Link href="#">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} BarberLine AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

**Step 3: Create marketing layout**

Create `app/(marketing)/layout.tsx`:
```tsx
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

**Step 4: Create landing page**

Create `app/(marketing)/page.tsx`:
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, MessageSquare, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Phone,
    title: "24/7 Call Answering",
    description: "Your AI picks up every call — even at 2 AM or mid-fade.",
  },
  {
    icon: Calendar,
    title: "Instant Booking",
    description: "Checks your real-time Square availability and books on the spot.",
  },
  {
    icon: MessageSquare,
    title: "SMS Confirmations",
    description: "Customers get a text confirmation the moment they book.",
  },
  {
    icon: BarChart3,
    title: "Call Analytics",
    description: "See call volume, booking rates, and peak hours at a glance.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Never miss a booking again
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          AI answers your barbershop phone 24/7, checks availability, and books
          appointments automatically. Like having a receptionist — without the
          payroll.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Start Free Trial</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/how-it-works">See How It Works</Link>
          </Button>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">The problem</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            You&apos;re mid-cut. The phone rings. You can&apos;t pick up. That
            customer tries the shop down the street. You just lost $40.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-lg font-medium">
            Barbers miss 40–60% of calls while cutting hair.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-center text-3xl font-bold">
          Everything you need to capture every call
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">
            Ready to stop losing customers to missed calls?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Set up in under 10 minutes. No contracts. Cancel anytime.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8"
            asChild
          >
            <Link href="/signup">Start Your Free Trial</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
```

**Step 5: Commit**

```bash
git add app/\(marketing\)/ components/marketing/
git commit -m "feat: add marketing site with landing page"
```

---

## Task 12: Marketing Site — Pricing & How It Works Pages

**Files:**
- Create: `app/(marketing)/pricing/page.tsx`
- Create: `app/(marketing)/how-it-works/page.tsx`

**Step 1: Create pricing page**

Create `app/(marketing)/pricing/page.tsx`:
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 49,
    description: "For solo barbers getting started",
    features: [
      "200 AI calls/month",
      "Square booking integration",
      "SMS confirmations",
      "Call log",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: 79,
    description: "For busy shops that want it all",
    features: [
      "Unlimited AI calls",
      "Square booking integration",
      "SMS confirmations",
      "Call log",
      "Full analytics dashboard",
      "Custom voice & greeting",
      "Multi-barber routing",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
];

export default function PricingPage() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          No contracts. No hidden fees. Cancel anytime.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.popular ? "border-primary shadow-lg" : ""}
          >
            <CardHeader>
              {plan.popular && (
                <p className="text-sm font-medium text-primary">Most Popular</p>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link href="/signup">{plan.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
```

**Step 2: Create how-it-works page**

Create `app/(marketing)/how-it-works/page.tsx`:
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "1",
    title: "Connect your Square account",
    description:
      "Link your Square Appointments in one click. We pull your services, hours, and barber profiles automatically.",
  },
  {
    number: "2",
    title: "Customize your AI receptionist",
    description:
      "Set your greeting, pick a voice style, and tell the AI about your shop. Takes about 5 minutes.",
  },
  {
    number: "3",
    title: "Go live and start booking",
    description:
      "Forward your shop number (or use a new one). Your AI starts answering calls immediately — 24/7.",
  },
];

export default function HowItWorksPage() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold">How it works</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Live in under 10 minutes. No technical skills required.
        </p>
      </div>
      <div className="mx-auto mt-16 max-w-2xl space-y-16">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {step.number}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-16 text-center">
        <Button size="lg" asChild>
          <Link href="/signup">Get Started Now</Link>
        </Button>
      </div>
    </section>
  );
}
```

**Step 3: Commit**

```bash
git add app/\(marketing\)/pricing/ app/\(marketing\)/how-it-works/
git commit -m "feat: add pricing and how-it-works pages"
```

---

## Task 13: Onboarding Flow

**Files:**
- Create: `app/(dashboard)/onboarding/page.tsx`
- Create: `components/dashboard/onboarding-steps.tsx`
- Create: `lib/vapi/create-agent.ts`

**Step 1: Create Vapi agent creation helper**

Create `lib/vapi/create-agent.ts`:
```typescript
interface CreateAgentParams {
  shopId: string;
  shopName: string;
  greeting: string;
}

export async function createVapiAgent(params: CreateAgentParams) {
  const res = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `BarberLine - ${params.shopName}`,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: params.greeting,
          },
        ],
        functions: [
          {
            name: "check_availability",
            description: "Check available appointment slots",
            parameters: {
              type: "object",
              properties: {
                shopId: { type: "string", enum: [params.shopId] },
                date: { type: "string", description: "ISO date string" },
                teamMemberId: { type: "string", description: "Optional barber preference" },
              },
              required: ["shopId", "date"],
            },
            serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/availability`,
          },
          {
            name: "create_booking",
            description: "Book an appointment",
            parameters: {
              type: "object",
              properties: {
                shopId: { type: "string", enum: [params.shopId] },
                startAt: { type: "string" },
                customerName: { type: "string" },
                customerPhone: { type: "string" },
                serviceVariationId: { type: "string" },
                teamMemberId: { type: "string" },
              },
              required: ["shopId", "startAt", "customerName", "customerPhone", "serviceVariationId"],
            },
            serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/book`,
          },
          {
            name: "get_shop_info",
            description: "Get shop hours, services, and pricing",
            parameters: {
              type: "object",
              properties: {
                shopId: { type: "string", enum: [params.shopId] },
                question: { type: "string" },
              },
              required: ["shopId"],
            },
            serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/info`,
          },
          {
            name: "take_message",
            description: "Take a message for the barber",
            parameters: {
              type: "object",
              properties: {
                shopId: { type: "string", enum: [params.shopId] },
                callerPhone: { type: "string" },
                message: { type: "string" },
              },
              required: ["shopId", "message"],
            },
            serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/message`,
          },
        ],
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM", // Default natural voice
      },
      serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
      metadata: { shopId: params.shopId },
    }),
  });

  return res.json();
}
```

**Step 2: Create onboarding steps component**

Create `components/dashboard/onboarding-steps.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface OnboardingStepsProps {
  shopId: string;
  hasSquare: boolean;
}

export function OnboardingSteps({ shopId, hasSquare }: OnboardingStepsProps) {
  const [step, setStep] = useState(hasSquare ? 2 : 1);
  const [greeting, setGreeting] = useState(
    "Thanks for calling! I can help you book an appointment. What day were you looking for?"
  );
  const [loading, setLoading] = useState(false);

  async function handleActivate() {
    setLoading(true);
    await fetch("/api/dashboard/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ greeting }),
    });
    // Trigger Vapi agent creation on the server
    await fetch("/api/dashboard/shop", { method: "POST" });
    setStep(4);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Step 1: Connect Square */}
      <Card className={step > 1 ? "opacity-60" : ""}>
        <CardHeader className="flex flex-row items-center gap-3">
          {step > 1 ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-sm font-bold">
              1
            </div>
          )}
          <CardTitle>Connect Square</CardTitle>
        </CardHeader>
        {step === 1 && (
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Link your Square Appointments to sync services, hours, and availability.
            </p>
            <Button asChild>
              <a href="/api/square/oauth">Connect Square Account</a>
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Step 2: Customize Greeting */}
      <Card className={step !== 2 ? "opacity-60" : ""}>
        <CardHeader className="flex flex-row items-center gap-3">
          {step > 2 ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-sm font-bold">
              2
            </div>
          )}
          <CardTitle>Customize Your AI Greeting</CardTitle>
        </CardHeader>
        {step === 2 && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>How should your AI answer the phone?</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
              />
            </div>
            <Button onClick={() => setStep(3)}>Next</Button>
          </CardContent>
        )}
      </Card>

      {/* Step 3: Go Live */}
      <Card className={step !== 3 ? "opacity-60" : ""}>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-sm font-bold">
            3
          </div>
          <CardTitle>Go Live</CardTitle>
        </CardHeader>
        {step === 3 && (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ll set up your AI phone number and start answering calls immediately.
            </p>
            <Button onClick={handleActivate} disabled={loading}>
              {loading ? "Setting up..." : "Activate AI Receptionist"}
            </Button>
          </CardContent>
        )}
      </Card>

      {step === 4 && (
        <Card className="border-primary">
          <CardContent className="py-8 text-center">
            <Check className="mx-auto h-12 w-12 text-primary" />
            <h3 className="mt-4 text-xl font-bold">You&apos;re all set!</h3>
            <p className="mt-2 text-muted-foreground">
              Your AI receptionist is live and ready to take calls.
            </p>
            <Button className="mt-6" asChild>
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 3: Create onboarding page**

Create `app/(dashboard)/onboarding/page.tsx`:
```tsx
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { OnboardingSteps } from "@/components/dashboard/onboarding-steps";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const shop = await getAuthenticatedShop();
  if (!shop) redirect("/signup");

  // If already fully set up, go to dashboard
  if (shop.square_token && shop.vapi_agent_id) {
    redirect("/dashboard");
  }

  return (
    <div className="py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Set up your AI receptionist</h1>
        <p className="mt-2 text-muted-foreground">
          Three quick steps and you&apos;re live.
        </p>
      </div>
      <OnboardingSteps shopId={shop.id} hasSquare={!!shop.square_token} />
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add lib/vapi/create-agent.ts components/dashboard/onboarding-steps.tsx app/\(dashboard\)/onboarding/
git commit -m "feat: add onboarding flow with Square connect and Vapi agent creation"
```

---

## Task 14: Billing Page (Stripe Placeholder)

**Files:**
- Create: `app/(dashboard)/billing/page.tsx`

**Step 1: Create billing page**

Create `app/(dashboard)/billing/page.tsx`:
```tsx
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export default async function BillingPage() {
  const shop = await getAuthenticatedShop();
  if (!shop) redirect("/signup");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current Plan</CardTitle>
          <Badge>Free Trial</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You&apos;re on the free trial. Upgrade to keep your AI receptionist running.
          </p>
          <div className="flex gap-3">
            <Button variant="outline">Starter — $49/mo</Button>
            <Button>Pro — $79/mo</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Stripe checkout integration coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/billing/
git commit -m "feat: add billing page placeholder"
```

---

## Task 15: Root Layout, Auth Pages & Final Wiring

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/sign-in/[[...sign-in]]/page.tsx`
- Create: `app/signup/[[...signup]]/page.tsx`

**Step 1: Update root layout with Clerk provider**

Modify `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BarberLine AI — Never Miss a Booking Again",
  description:
    "AI voice agent that answers your barbershop phone 24/7, books appointments, and sends confirmations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Step 2: Create sign-in page**

Create `app/sign-in/[[...sign-in]]/page.tsx`:
```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn afterSignInUrl="/dashboard" />
    </div>
  );
}
```

**Step 3: Create signup page**

Create `app/signup/[[...signup]]/page.tsx`:
```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp afterSignUpUrl="/dashboard/onboarding" />
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add app/layout.tsx app/sign-in/ app/signup/ middleware.ts
git commit -m "feat: add auth pages and root layout with Clerk provider"
```

---

## Task 16: Verify Build & Final Commit

**Step 1: Verify the project builds**

```bash
npm run build
```

Fix any TypeScript or build errors.

**Step 2: Final commit**

```bash
git add -A
git commit -m "chore: fix build errors and finalize MVP"
```

---

## Summary

| Task | What It Builds | Estimated Steps |
|------|---------------|-----------------|
| 1 | Project scaffolding, deps, env | 8 |
| 2 | Database schema + types | 4 |
| 3 | Square API integration library | 5 |
| 4 | Vapi webhook API routes (5 endpoints) | 7 |
| 5 | Square OAuth + Twilio SMS | 4 |
| 6 | Dashboard API routes (4 endpoints) | 6 |
| 7 | Dashboard layout + overview | 6 |
| 8 | Dashboard calls page | 3 |
| 9 | Dashboard analytics page | 3 |
| 10 | Dashboard settings pages (3 pages) | 5 |
| 11 | Marketing site landing page | 5 |
| 12 | Pricing + how-it-works pages | 3 |
| 13 | Onboarding flow + Vapi agent creation | 4 |
| 14 | Billing page placeholder | 2 |
| 15 | Auth pages + root layout | 4 |
| 16 | Build verification | 2 |
| **Total** | **Full MVP** | **71 steps** |
