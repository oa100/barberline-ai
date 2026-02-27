# BarberLine AI — Product Roadmap & Backlog

**Last Updated:** 2026-02-26

---

## Completed


| Item                                                              | Date       | Notes                                                                                                                             |
| ----------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Core app (Next.js 16 + Clerk + Supabase + Vapi + Square + Twilio) | 2026-02-25 | Dashboard, marketing pages, call handling, booking                                                                                |
| Security audit + critical/high fixes                              | 2026-02-25 | CRITICAL-01 through 04, HIGH-05 fixed. See `docs/security-audit-2026-02-25.md`                                                    |
| BookingProvider abstraction layer                                 | 2026-02-26 | Interface + adapter pattern, Square first. See `docs/plans/2026-02-26-booking-provider-abstraction-design.md`                     |
| PWA + Mobile Responsive                                           | 2026-02-26 | Manifest, SW, offline fallback, mobile sidebar, call cards, marketing hamburger. See `docs/plans/2026-02-26-pwa-mobile-design.md` |
| Marketing strategy (DFW launch)                                   | 2026-02-25 | See `docs/marketing-strategy-dfw-2026-02-25.md`                                                                                   |
| Mobile app strategy                                               | 2026-02-25 | PWA first, React Native later. See `docs/mobile-app-strategy-2026-02-25.md`                                                       |
| Cost analysis                                                     | 2026-02-26 | See `docs/cost-analysis-2026-02-26.md`                                                                                            |


---

## Backlog — Ordered by Priority

### P0: Launch Blockers

- **Dead links + missing pages** — Created `/about`, `/contact`, `/privacy`, `/terms` pages.
- **Stripe billing integration** — Checkout, portal, webhooks, billing page. Plans: Starter ($49/mo), Pro ($99/mo). 14-day free trial.
- **Remaining security fixes** — All findings from audit fixed:
  - HIGH-01: Service-role Supabase client for Vapi routes
  - HIGH-02: AES-256-GCM token encryption at rest
  - HIGH-03: Rate limiting on all API endpoints
  - HIGH-04: Prompt injection sanitization (length + trim)
  - HIGH-05: SSRF eliminated (direct function call)
  - MEDIUM-01: Zod schema validation on settings
  - MEDIUM-02: Security headers in next.config.ts
  - MEDIUM-04: Timing-safe secret comparison
  - MEDIUM-05: Generic error messages (no detail leaking)
  - MEDIUM-06: Shop ID validation in Vapi tool calls

### P1: Pre-Launch Polish

- **Auth page branding** — Dark/gold branded layout, Clerk appearance theming, logo, privacy/terms links.
- **Annual pricing option** — $468/yr Starter ($39/mo), $948/yr Pro ($79/mo) — 20% discount. Monthly/annual toggle on pricing + billing pages. See `docs/plans/2026-02-26-annual-pricing-plan.md`.
- **SMS confirmation to customers** — Currently only texts the barber. Customers get nothing after booking.
- **Replace PWA placeholder icons** — Current icons are auto-generated "BL" placeholders. Need branded icons (gold barber pole on dark).
- **Footer dead link audit** — Ensure all footer links resolve after missing pages are created.

### P2: Growth Features

- **Boulevard booking provider** — 2nd adapter for the BookingProvider abstraction. GraphQL API, self-serve dev portal.
- **Push notifications (shop owner)** — New booking, cancellation, missed call alerts. Critical for mobile owner experience.
- **Referral program** — $50 credit per referral, first month free for referee. Dashboard billing page integration.
- **Demo video / landing page** — 60-second demo for in-person sales + social media.
- **Local SEO landing pages** — `/dallas`, `/fort-worth`, `/arlington`, `/frisco` with neighborhood-specific copy.
- **Audit logging** — `audit_logs` table for OAuth events, settings changes, admin actions (INFO-03).

### P3: Expansion — Vertical Growth

The core platform ("AI front desk + booking orchestration") is horizontal. The `BookingProvider` abstraction already supports multi-vertical without a rewrite. Expansion work per vertical is: (1) new booking provider adapter, (2) vertical-specific agent prompt templates, (3) marketing/landing pages.

**Vertical expansion sequence:**

| Phase | Vertical | Why Next | Booking Platforms | Avg Ticket | Key Difference from Barbershops |
|-------|----------|----------|-------------------|------------|-------------------------------|
| 1 | Barbershops | Prove model, get case studies | Square | $25-45 | — |
| 2 | Hair salons | Same ecosystem, minimal prompt changes, higher LTV | Square, Boulevard | $60-150 | Longer appointments, more service variation |
| 3 | Med spas / esthetics | Higher ticket justifies Pro tier easily | Boulevard, Vagaro | $150-300+ | Treatment consultations, contraindication questions |
| 4 | Nail salons + massage | High-volume repeat bookings, proves retention | Square, Acuity, Vagaro | $40-80 | Multiple concurrent technicians, walk-in culture |

**Verticals to defer:**

| Vertical | Reason to Wait |
|----------|----------------|
| Dental / chiropractic | Regulated intake forms, insurance verification, compliance overhead |
| Home services (HVAC, plumbing) | Dispatch logic, quoting, variable job scoping — fundamentally different problem |
| Auto services | Estimate-driven workflow, parts ordering, multi-day jobs |
| Enterprise / multi-location | Requires team management, centralized dashboard, per-location pricing — build after vertical PMF |

**Strategic filter for entering a new vertical** — only enter if all five hold:
1. Booking workflow is structured (pick a time slot, not "we'll call you back")
2. Missed-call pain is high (operator is hands-on with clients)
3. Usable scheduling API exists (Square, Boulevard, Acuity, Vagaro, etc.)
4. Average ticket supports SaaS pricing ($49-199+/mo)
5. Owner can buy without enterprise procurement

**Per-vertical work required:**

- **Booking provider adapter** — implement `BookingProvider` interface for the vertical's dominant platform (e.g., Boulevard for salons, Vagaro for spas)
- **Agent prompt templates** — vertical-specific greeting, service vocabulary, FAQ handling (e.g., "Do you do balayage?" vs "Do you do fades?")
- **Onboarding flow** — vertical-aware setup wizard (different default services, terminology)
- **Marketing pages** — vertical-specific landing page, case studies, SEO pages
- **Pricing** — same tiers, potentially higher Pro ceiling for high-ticket verticals

#### P3 Feature Backlog

- **Acuity booking provider** — 3rd adapter. Common in massage/wellness. Requires $49/mo plan per shop.
- **Vagaro booking provider** — 4th adapter. Dominant in salons + med spas. REST API.
- **Vertical prompt template system** — Admin-configurable base prompts per industry, with per-shop customization on top.
- **React Native mobile app** — Shop owner MVP: schedule, push notifications, Talk to Agent. Uses shared types from web.
- **Customer-facing features** — Discovery, booking, account. Deferred per strategic decision (shop owner first).
- **Multi-location / enterprise** — Per-location pricing, team management, centralized dashboard. After vertical PMF.

---

## Strategic Decisions Log


| Date       | Decision                                                                            |
| ---------- | ----------------------------------------------------------------------------------- |
| 2026-02-26 | Vertical expansion: barbershops → hair salons → med spas → nail/massage. Defer dental, home services, auto. |
| 2026-02-26 | No codebase changes needed today for multi-vertical — BookingProvider abstraction already supports it |
| 2026-02-26 | Enter new verticals only when: structured booking, high missed-call pain, scheduling API exists, ticket supports SaaS pricing, owner-buyer |
| 2026-02-26 | Avoid going horizontal too early — vertical-specific product depth beats generic "AI receptionist for SMBs" |
| 2026-02-26 | Prioritize shop owner experience over customer-facing app                           |
| 2026-02-26 | PWA first to prove mobile value, React Native later                                 |
| 2026-02-26 | Multi-platform booking: Ship Square first, add Boulevard/Acuity via adapter pattern |
| 2026-02-26 | One booking provider per shop for now, design schema for multiple later             |
| 2026-02-26 | Annual pricing at 20% off ($468/$948 yr). Keep monthly at $49/$99.                  |
| 2026-02-25 | DFW as first market, Texas expansion, then national                                 |


