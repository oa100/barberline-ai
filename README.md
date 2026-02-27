# BarberLine AI

AI-powered receptionist for barbershops. BarberLine AI answers calls 24/7, books appointments into your existing calendar, and sends SMS confirmations — so barbers never miss a client while they're cutting.

## The Problem

Independent barbers miss 40-60% of incoming calls because they're busy with clients. Missed calls mean missed revenue.

## How It Works

1. A client calls your shop number
2. The AI agent answers, checks availability, and books the appointment
3. The booking goes straight into your Square calendar
4. You and the client get an SMS confirmation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) with Row Level Security |
| AI Voice | Vapi + OpenAI GPT-4o-mini + ElevenLabs TTS |
| Booking | Square (via BookingProvider abstraction) |
| Payments | Stripe (subscriptions + billing portal) |
| SMS | Twilio |
| UI | Tailwind CSS, shadcn/ui, Radix UI, Recharts |
| Testing | Vitest (~195 unit tests), Playwright (20 E2E tests) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Clerk sign-in/sign-up pages
│   ├── (dashboard)/     # Protected shop owner dashboard
│   │   └── dashboard/
│   │       ├── page.tsx          # Overview with stat cards
│   │       ├── onboarding/       # New user setup wizard
│   │       ├── calls/            # Call log table
│   │       ├── analytics/        # 30-day charts + stats
│   │       ├── billing/          # Stripe subscription management
│   │       └── settings/         # Shop, integrations, voice config
│   ├── (marketing)/     # Public landing, pricing, about, etc.
│   └── api/
│       ├── vapi/        # AI agent webhooks (book, availability, info, message)
│       ├── square/      # OAuth flow for connecting Square
│       ├── stripe/      # Checkout, portal, webhook
│       ├── twilio/      # SMS sending
│       └── dashboard/   # Dashboard data endpoints
├── components/
│   ├── ui/              # shadcn primitives
│   ├── dashboard/       # Dashboard-specific components
│   └── marketing/       # Marketing page components
└── lib/
    ├── booking/         # BookingProvider abstraction (Square adapter)
    ├── vapi/            # Agent creation, webhook validation
    ├── supabase/        # Browser, server, and service-role clients
    ├── crypto.ts        # AES-256-GCM token encryption
    ├── rate-limit.ts    # Per-IP sliding window rate limiter
    └── stripe.ts        # Stripe client
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Accounts: [Supabase](https://supabase.com), [Clerk](https://clerk.com), [Vapi](https://vapi.ai), [Square](https://developer.squareup.com), [Stripe](https://stripe.com), [Twilio](https://twilio.com)

### Environment Variables

Create a `.env.local` file:

```bash
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
VAPI_SERVER_SECRET=          # 32-byte hex for webhook auth

# Square
SQUARE_APPLICATION_ID=
SQUARE_ACCESS_TOKEN=         # Sandbox only; production uses per-shop OAuth
SQUARE_ENVIRONMENT=sandbox

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security
ENCRYPTION_KEY=              # 64-char hex string for AES-256-GCM
```

### Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Setup

Run the Supabase migrations in order:

```bash
supabase db push
```

Or apply manually from `supabase/migrations/`.

## Testing

```bash
# Unit tests
npm test

# Unit tests in watch mode
npm run test:watch

# E2E tests (requires dev server running)
npm run test:e2e
```

For E2E tests, add these to `.env.local`:

```bash
NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true
CLERK_USER_EMAIL=your+clerk_test@email.com
```

## Key Architecture Decisions

- **BookingProvider abstraction** — Square is the current adapter; the interface supports adding Boulevard, Acuity, or other providers without changing the core logic
- **Two Supabase clients** — a cookie-based server client for user-scoped queries (RLS) and a service-role client for webhook/Vapi routes where there's no user session
- **Encrypted tokens** — Square OAuth tokens are stored with AES-256-GCM encryption at rest
- **Vapi webhook validation** — HMAC secret comparison on all incoming webhook payloads
- **Rate limiting** — in-memory sliding window limiter on all public API endpoints

## Deployment

Deployed on [Vercel](https://vercel.com). Push to `main` triggers a production deploy. Environment variables are managed in the Vercel dashboard.

## License

Private — all rights reserved.
