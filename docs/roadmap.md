# BarberLine AI — Product Roadmap & Backlog

**Last Updated:** 2026-02-26

---

## Completed

| Item | Date | Notes |
|---|---|---|
| Core app (Next.js 16 + Clerk + Supabase + Vapi + Square + Twilio) | 2026-02-25 | Dashboard, marketing pages, call handling, booking |
| Security audit + critical/high fixes | 2026-02-25 | CRITICAL-01 through 04, HIGH-05 fixed. See `docs/security-audit-2026-02-25.md` |
| BookingProvider abstraction layer | 2026-02-26 | Interface + adapter pattern, Square first. See `docs/plans/2026-02-26-booking-provider-abstraction-design.md` |
| PWA + Mobile Responsive | 2026-02-26 | Manifest, SW, offline fallback, mobile sidebar, call cards, marketing hamburger. See `docs/plans/2026-02-26-pwa-mobile-design.md` |
| Marketing strategy (DFW launch) | 2026-02-25 | See `docs/marketing-strategy-dfw-2026-02-25.md` |
| Mobile app strategy | 2026-02-25 | PWA first, React Native later. See `docs/mobile-app-strategy-2026-02-25.md` |
| Cost analysis | 2026-02-26 | See `docs/cost-analysis-2026-02-26.md` |

---

## Backlog — Ordered by Priority

### P0: Launch Blockers

- [x] **Dead links + missing pages** — Created `/about`, `/contact`, `/privacy`, `/terms` pages.
- [x] **Stripe billing integration** — Checkout, portal, webhooks, billing page. Plans: Starter ($49/mo), Pro ($99/mo). 14-day free trial.
- [x] **Remaining security fixes** — All findings from audit fixed:
  - [x] HIGH-01: Service-role Supabase client for Vapi routes
  - [x] HIGH-02: AES-256-GCM token encryption at rest
  - [x] HIGH-03: Rate limiting on all API endpoints
  - [x] HIGH-04: Prompt injection sanitization (length + trim)
  - [x] HIGH-05: SSRF eliminated (direct function call)
  - [x] MEDIUM-01: Zod schema validation on settings
  - [x] MEDIUM-02: Security headers in next.config.ts
  - [x] MEDIUM-04: Timing-safe secret comparison
  - [x] MEDIUM-05: Generic error messages (no detail leaking)
  - [x] MEDIUM-06: Shop ID validation in Vapi tool calls

### P1: Pre-Launch Polish

- [x] **Auth page branding** — Dark/gold branded layout, Clerk appearance theming, logo, privacy/terms links.
- [ ] **SMS confirmation to customers** — Currently only texts the barber. Customers get nothing after booking.
- [ ] **Replace PWA placeholder icons** — Current icons are auto-generated "BL" placeholders. Need branded icons (gold barber pole on dark).
- [ ] **Footer dead link audit** — Ensure all footer links resolve after missing pages are created.

### P2: Growth Features

- [ ] **Boulevard booking provider** — 2nd adapter for the BookingProvider abstraction. GraphQL API, self-serve dev portal.
- [ ] **Push notifications (shop owner)** — New booking, cancellation, missed call alerts. Critical for mobile owner experience.
- [ ] **Referral program** — $50 credit per referral, first month free for referee. Dashboard billing page integration.
- [ ] **Demo video / landing page** — 60-second demo for in-person sales + social media.
- [ ] **Local SEO landing pages** — `/dallas`, `/fort-worth`, `/arlington`, `/frisco` with neighborhood-specific copy.
- [ ] **Audit logging** — `audit_logs` table for OAuth events, settings changes, admin actions (INFO-03).

### P3: Expansion

- [ ] **Acuity booking provider** — 3rd adapter. Requires $49/mo plan per shop.
- [ ] **React Native mobile app** — Shop owner MVP: schedule, push notifications, Talk to Agent. Uses shared types from web.
- [ ] **Customer-facing features** — Discovery, booking, account. Deferred per strategic decision (shop owner first).
- [ ] **Women's salon vertical** — Same tech, different marketing wrapper. After 50+ paying barbershops.
- [ ] **Multi-location / enterprise** — Per-location pricing, team management, centralized dashboard.

---

## Strategic Decisions Log

| Date | Decision |
|---|---|
| 2026-02-26 | Prioritize shop owner experience over customer-facing app |
| 2026-02-26 | PWA first to prove mobile value, React Native later |
| 2026-02-26 | Multi-platform booking: Ship Square first, add Boulevard/Acuity via adapter pattern |
| 2026-02-26 | One booking provider per shop for now, design schema for multiple later |
| 2026-02-25 | DFW as first market, Texas expansion, then national |
