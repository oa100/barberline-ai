# BarberLine AI — Design Document

**Date:** 2026-02-23
**Status:** Approved

## Overview

AI voice agent that answers barbershop calls 24/7, books appointments via Square, and gives barbers a dashboard to track calls and bookings. Includes a marketing site for customer acquisition.

## Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js (App Router) |
| Voice AI | Vapi |
| LLM | GPT-4o-mini |
| Booking | Square Bookings API |
| SMS | Twilio |
| Database | Supabase (Postgres) |
| Auth | Clerk |
| Hosting | Vercel |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Tables | TanStack Table |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Vercel (Next.js)                    │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Marketing   │  │  Dashboard   │  │ API Routes│ │
│  │  (public)    │  │  (authed)    │  │           │ │
│  │              │  │  Clerk auth  │  │ /api/vapi │ │
│  │  - Landing   │  │  - Calls log │  │ /api/square│ │
│  │  - Pricing   │  │  - Analytics │  │ /api/webhook│ │
│  │  - Signup    │  │  - Settings  │  │           │ │
│  └──────────────┘  └──────┬───────┘  └─────┬─────┘ │
│                           │                │        │
└───────────────────────────┼────────────────┼────────┘
                            │                │
              ┌─────────────▼────────────────▼──────┐
              │           Supabase                   │
              │  - users / shops / call_logs         │
              │  - booking_history / settings         │
              └──────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
   ┌─────▼─────┐    ┌──────▼──────┐    ┌──────▼──────┐
   │   Vapi     │    │  Square     │    │   Twilio    │
   │  Voice AI  │    │  Bookings   │    │   SMS       │
   └────────────┘    └─────────────┘    └─────────────┘
```

**Flow:**
1. Customer calls the Vapi phone number
2. Vapi runs the voice agent, calls `/api/vapi/function` endpoints for availability/booking
3. API routes query Square Bookings API, return structured data to Vapi
4. Vapi speaks the response to the caller
5. On successful booking, API sends SMS confirmation via Twilio and logs to Supabase
6. Barber sees call history and stats in the dashboard

## Data Model

```sql
-- Shops (one per barbershop location)
shops
  id              uuid PK
  clerk_user_id   text
  name            text
  phone_number    text (Vapi-assigned)
  square_token    text (encrypted)
  square_location text
  vapi_agent_id   text
  timezone        text
  greeting        text
  created_at      timestamptz

-- Team members (barbers at the shop)
team_members
  id              uuid PK
  shop_id         uuid FK → shops
  square_member_id text
  name            text
  active          boolean

-- Call logs (every inbound call)
call_logs
  id              uuid PK
  shop_id         uuid FK → shops
  vapi_call_id    text
  caller_phone    text
  duration_sec    integer
  outcome         enum (booked, no_availability, fallback, hangup, info_only)
  transcript      jsonb
  created_at      timestamptz

-- Bookings (successful AI-booked appointments)
bookings
  id              uuid PK
  shop_id         uuid FK → shops
  call_log_id     uuid FK → call_logs
  square_booking_id text
  customer_name   text
  customer_phone  text
  team_member_id  uuid FK → team_members (nullable)
  service         text
  start_time      timestamptz
  status          enum (confirmed, cancelled, no_show)
  created_at      timestamptz
```

## Voice Agent (Vapi)

**System prompt template** (per shop, editable in dashboard):
```
You are the AI receptionist for {{shop_name}}. You answer calls,
help customers book appointments, and answer basic questions.
Be friendly, natural, and efficient. Keep responses short.

Shop info:
- Name: {{shop_name}}
- Address: {{address}}
- Hours: {{hours}}
- Services: {{services_list}}
- Cancellation policy: {{policy}}

Rules:
- Offer 2-3 available time slots, nearest first
- Always confirm: service, date/time, customer name
- If no availability on requested day, suggest next available
- If you can't help, take a message and notify the barber
- Never make up availability — only offer what the API returns
```

**Vapi function definitions:**

| Function | Endpoint | Purpose |
|----------|----------|---------|
| check_availability | POST /api/vapi/availability | Query Square SearchAvailability |
| create_booking | POST /api/vapi/book | Create booking in Square |
| get_shop_info | POST /api/vapi/info | Return hours, services, pricing |
| take_message | POST /api/vapi/message | Save message, SMS alert barber |

**Voice settings:** GPT-4o-mini, natural voice, <500ms latency target, 1.5s silence detection.

## API Routes

```
app/api/
├── vapi/
│   ├── availability/route.ts   # Query Square SearchAvailability
│   ├── book/route.ts           # Create booking in Square
│   ├── info/route.ts           # Return shop details
│   ├── message/route.ts        # Save message, SMS barber
│   └── webhook/route.ts        # Post-call webhook (save call log)
├── square/
│   ├── oauth/route.ts          # Square OAuth flow
│   ├── callback/route.ts       # Square OAuth callback
│   └── webhook/route.ts        # Square booking change notifications
├── twilio/
│   └── send/route.ts           # Send SMS confirmation
└── dashboard/
    ├── calls/route.ts          # GET call logs
    ├── analytics/route.ts      # GET aggregated stats
    ├── settings/route.ts       # GET/PUT shop settings
    └── shop/route.ts           # GET/PUT shop profile
```

**Security:**
- `/api/vapi/*` — Vapi server secret header validation
- `/api/square/*` — Square PKCE OAuth, webhook signature validation
- `/api/dashboard/*` — Clerk session token middleware
- Secrets in Vercel env vars, Square tokens encrypted in Supabase

## Dashboard

```
app/(dashboard)/
├── layout.tsx              # Clerk auth wrapper, sidebar nav
├── page.tsx                # Overview: today's calls, bookings, quick stats
├── calls/page.tsx          # Call log table with transcript viewer
├── analytics/page.tsx      # Charts: volume, conversion, peak hours
├── settings/
│   ├── page.tsx            # Shop profile
│   ├── voice/page.tsx      # AI greeting, voice selection
│   └── integrations/page.tsx  # Square connection, Twilio config
└── billing/page.tsx        # Subscription plan, usage (Stripe)
```

**Features:** Real-time call count (Supabase realtime), expandable transcript rows, Square connection status, voice preview.

## Marketing Site

```
app/(marketing)/
├── page.tsx                # Landing: hero, features, pricing, CTA
├── pricing/page.tsx        # Tier comparison
├── how-it-works/page.tsx   # 3-step explainer + demo audio
└── signup/page.tsx         # Clerk signup → onboarding
```

**Onboarding flow:**
1. Connect Square (OAuth)
2. Confirm services/hours (from Square)
3. Customize AI greeting
4. Assign phone number (Vapi)
5. Test call → go live

**Pricing:**

| | Starter $49/mo | Pro $79/mo |
|---|---|---|
| AI call answering | 200 calls/mo | Unlimited |
| Square booking | Yes | Yes |
| SMS confirmations | Yes | Yes |
| Call log | Yes | Yes |
| Analytics | Basic | Full |
| Custom voice/greeting | No | Yes |
| Multi-barber routing | No | Yes |
| Priority support | No | Yes |
