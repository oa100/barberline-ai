# BarberLine AI -- Mobile App Strategy Document

**Date:** February 25, 2026
**Version:** 1.0
**Status:** Draft for Review
**Prepared by:** Mobile Architecture & Product Strategy Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Web Application Audit](#2-current-web-application-audit)
3. [Customer Journey Analysis](#3-customer-journey-analysis)
4. [Shop Owner Journey Analysis](#4-shop-owner-journey-analysis)
5. [Mobile App Architecture Recommendations](#5-mobile-app-architecture-recommendations)
6. [Feature Recommendations for Mobile](#6-feature-recommendations-for-mobile)
7. [Technical Considerations](#7-technical-considerations)
8. [Phased Rollout Plan](#8-phased-rollout-plan)
9. [Risk Assessment](#9-risk-assessment)
10. [Appendix: Current Codebase Inventory](#appendix-current-codebase-inventory)

---

## 1. Executive Summary

BarberLine AI is a Next.js 16 web application that provides AI-powered voice receptionists for barbershops. The platform currently serves one persona -- the **shop owner** -- who onboards their business, connects Square, and monitors call/booking analytics through a web dashboard.

The current product has a critical gap: there is **no customer-facing experience**. Barbershop customers interact with BarberLine exclusively via inbound phone calls to the AI voice agent. They never visit the web app, see a confirmation screen, or have a persistent relationship with the platform.

A mobile app unlocks two transformative opportunities:

1. **For customers:** A booking, discovery, and loyalty surface that turns one-time callers into repeat clients with push notifications, booking history, and walk-in queue management.
2. **For shop owners:** A mobile-first dashboard that delivers real-time booking notifications, on-the-go analytics, and client management without needing to sit at a desktop.

This document provides a comprehensive strategy for building mobile applications that complement and extend the existing web platform.

---

## 2. Current Web Application Audit

### 2.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.1.6 |
| Runtime | React | 19.2.3 |
| Authentication | Clerk (`@clerk/nextjs`) | 6.38.2 |
| Database | Supabase (Postgres + RLS) | SSR 0.8.0, JS 2.97.0 |
| Voice AI | Vapi (server + web SDK) | Server 0.11.0, Web 2.5.2 |
| Appointments | Square Bookings API | SDK 44.0.0 |
| SMS | Twilio | 5.12.2 |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui, Recharts | Various |
| Payments/Billing | Not yet implemented | Stripe planned |

### 2.2 Route & Page Inventory

#### Marketing Pages (public, unauthenticated)

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/(marketing)/page.tsx` | Landing page with hero, problem statement (60% missed calls / $1,200 lost monthly), feature cards (24/7 calls, instant booking, SMS confirmations, analytics), CTA |
| `/how-it-works` | `src/app/(marketing)/how-it-works/page.tsx` | 3-step onboarding flow explanation (Connect Square, Customize AI, Go Live) |
| `/pricing` | `src/app/(marketing)/pricing/page.tsx` | Two plans: Starter ($49/mo, 200 calls) and Pro ($79/mo, unlimited calls, custom voice, multi-barber) |

**Observations:**
- The marketing layout uses a dark theme with gold accents (`#0A0A0A` background, gold highlights), a grain texture overlay, and "barber stripe" decorative elements.
- The header is sticky with backdrop blur. Navigation links are hidden on mobile (`hidden md:flex`), meaning there is no mobile hamburger menu -- a significant gap.
- The footer links to `/about`, `/contact`, `/privacy`, and `/terms`, but none of these pages exist in the codebase. These are dead links.

#### Authentication Pages

| Route | File | Description |
|-------|------|-------------|
| `/sign-in` | `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Clerk `<SignIn>` component, redirects to `/dashboard` after sign-in |
| `/signup` | `src/app/(auth)/signup/[[...signup]]/page.tsx` | Clerk `<SignUp>` component, redirects to `/dashboard/onboarding` after sign-up |

**Observations:**
- The auth layout is a bare wrapper (`<>{children}</>`) with no styling or branding. On mobile, the Clerk components will render in a plain white screen with no BarberLine branding context.
- There is no background, logo, or visual continuity with the marketing pages.

#### Dashboard Pages (authenticated, shop-owner only)

| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | Overview: stat cards (Calls Today, Booked Today, Upcoming), Talk to Agent button, Simulate Call button |
| `/dashboard/onboarding` | `src/app/(dashboard)/dashboard/onboarding/page.tsx` | 3-step wizard: Connect Square, Customize Greeting, Go Live (Activate AI Receptionist) |
| `/dashboard/calls` | `src/app/(dashboard)/dashboard/calls/page.tsx` | Call log table (last 50 calls) with expandable transcript rows showing time, caller phone, duration, outcome badges |
| `/dashboard/analytics` | `src/app/(dashboard)/dashboard/analytics/page.tsx` | 30-day stats: Total Calls, Booked, Conversion Rate, Avg Duration; Call Volume bar chart; Peak Hours line chart |
| `/dashboard/settings` | `src/app/(dashboard)/dashboard/settings/page.tsx` | Shop Name and Timezone text inputs |
| `/dashboard/settings/voice` | `src/app/(dashboard)/dashboard/settings/voice/page.tsx` | AI Greeting textarea |
| `/dashboard/settings/integrations` | `src/app/(dashboard)/dashboard/settings/integrations/page.tsx` | Square connection status, AI Phone Line status |
| `/dashboard/billing` | `src/app/(dashboard)/dashboard/billing/page.tsx` | Current plan display (Free Trial), upgrade buttons (non-functional, Stripe "coming soon") |

**Observations:**
- The dashboard uses a fixed 256px-wide sidebar (`w-64`) with no responsive or collapsible behavior. On mobile viewports, this sidebar will consume the entire screen width, making the dashboard completely unusable on phones.
- All dashboard pages use server-side rendering with `getAuthenticatedShop()`, which is good for SEO-irrelevant authenticated pages but means data freshness depends on page navigation.
- The "Talk to Agent" button uses the Vapi Web SDK (`@vapi-ai/web`) to initiate a browser-based voice call with real-time transcript. This is a differentiating feature that would translate powerfully to mobile.
- The "Simulate Call" button triggers a server-side simulated call and reloads the page after 1.5 seconds -- a pattern that would not work well on mobile.

### 2.3 API Route Inventory

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/dashboard/analytics` | GET | 30-day call analytics | Clerk |
| `/api/dashboard/calls` | GET | Call log list | Clerk |
| `/api/dashboard/onboarding/activate` | POST | Create Vapi agent, activate AI receptionist | Clerk |
| `/api/dashboard/settings` | GET/PUT | Read/update shop settings | Clerk |
| `/api/dashboard/shop` | GET | Get current shop data | Clerk |
| `/api/dashboard/simulate-call` | POST | Simulate an AI call | Clerk |
| `/api/dashboard/vapi-token` | GET | Get Vapi token for web calls | Clerk |
| `/api/square/oauth` | GET | Initiate Square OAuth flow | Clerk |
| `/api/square/callback` | GET | Square OAuth callback | None (redirect) |
| `/api/twilio/send` | POST | Send SMS | Server secret |
| `/api/vapi/availability` | POST | Check Square availability (Vapi function call) | Vapi secret |
| `/api/vapi/book` | POST | Create Square booking (Vapi function call) | Vapi secret |
| `/api/vapi/info` | POST | Get shop info/services/hours (Vapi function call) | Vapi secret |
| `/api/vapi/message` | POST | Forward message to shop via SMS (Vapi function call) | Vapi secret |
| `/api/vapi/webhook` | POST | End-of-call report processing | Vapi secret |

**Observations:**
- The API layer is cleanly separated into two auth domains: Clerk-authenticated dashboard APIs and Vapi-secret-authenticated voice agent APIs. This is a solid foundation for mobile.
- There are no customer-facing APIs. No endpoints exist for a customer to look up a shop, view their bookings, or manage their account.
- The Vapi function call APIs (`/api/vapi/*`) are designed for server-to-server communication and return results in Vapi's function call response format, not standard REST.

### 2.4 Database Schema

Four tables with Row Level Security:

- **shops** -- Core entity. Fields: `id`, `clerk_user_id`, `name`, `phone_number`, `square_token`, `square_location`, `vapi_agent_id`, `timezone`, `greeting`, `created_at`
- **team_members** -- Barbers in a shop. Fields: `id`, `shop_id`, `square_member_id`, `name`, `active`
- **call_logs** -- AI call records. Fields: `id`, `shop_id`, `vapi_call_id`, `caller_phone`, `duration_sec`, `outcome` (enum), `transcript` (JSONB), `created_at`
- **bookings** -- Appointments. Fields: `id`, `shop_id`, `call_log_id`, `square_booking_id`, `customer_name`, `customer_phone`, `team_member_id`, `service`, `start_time`, `status` (enum), `created_at`

**Observations:**
- There is no `customers` table. Customer identity is ephemeral -- just a name and phone number stored on individual bookings. This is the single biggest schema gap for building a customer-facing mobile app.
- RLS policies use `auth.jwt()->>'sub'` to match `clerk_user_id`, tying all data access to the shop owner. There are no policies for customer access.
- The `bookings` table has no `end_time`, no `notes` field, and no `customer_id` foreign key.

### 2.5 Component Inventory

**Dashboard Components:**
- `Sidebar` -- Fixed 264px sidebar with navigation and Clerk UserButton
- `StatCard` -- Simple card with title, value, description
- `CallTable` -- Expandable table with outcome badges and transcript display
- `CallVolumeChart` / `PeakHoursChart` -- Recharts bar and line charts
- `OnboardingSteps` -- 3-step wizard with progressive disclosure
- `SettingsForm` -- Basic name/timezone input form
- `SimulateCallButton` -- Server-side call simulation trigger
- `TalkToAgentButton` -- Browser-based Vapi voice call with live transcript

**Marketing Components:**
- `Header` -- Sticky header with logo, nav (desktop-only), auth buttons
- `Footer` -- 4-column footer with dead links

**UI Primitives (shadcn/ui):**
Avatar, Badge, Button, Card, Dialog, DropdownMenu, Input, Label, Separator, Sheet, Skeleton, Sonner (toast), Table, Tabs, Textarea

---

## 3. Customer Journey Analysis

### 3.1 Current State -- The Customer Has No Digital Relationship

Today, a barbershop customer's journey with BarberLine AI is:

1. Customer calls the barbershop phone number
2. Vapi AI answers, greets them, helps check availability
3. AI books the appointment via Square
4. SMS confirmation is sent to the **barber** (not the customer)
5. Journey ends -- no follow-up, no account, no way to rebook

This is a fundamentally one-directional, voice-only experience. The customer never knows they interacted with "BarberLine AI" and has no way to self-serve.

### 3.2 Desired State -- Full Customer Lifecycle on Mobile

#### Phase 1: Discovery
- **Problem:** How does a customer find a barbershop that uses BarberLine AI? Currently, they cannot.
- **Mobile solution:** A shop directory with search by location, name, or specialty. Shops that activate BarberLine AI automatically get a public profile.
- **Key screens:** Search/explore, shop profile (services, hours, photos, reviews, team members)

#### Phase 2: Booking
- **Problem:** Booking is voice-only. Customers who prefer not to call have no alternative.
- **Mobile solution:** Dual booking paths:
  - **Traditional:** Browse available slots, select service/barber, confirm. Powered by the same Square Availability + Booking APIs already integrated.
  - **Voice AI:** Tap-to-call the AI receptionist from the app. The Vapi Web SDK (already used in the dashboard's "Talk to Agent" button) can be adapted for customer-facing mobile calls. This is the signature differentiator.
- **Key screens:** Service picker, date/time selector, barber selector, booking confirmation

#### Phase 3: Confirmation & Reminders
- **Problem:** SMS confirmation is sent only to the barber. The customer gets nothing.
- **Mobile solution:**
  - Immediate push notification: "Your appointment at [Shop] is confirmed for [Date] at [Time]"
  - SMS fallback for customers without the app installed
  - 24-hour reminder push notification
  - 1-hour reminder push notification
  - Calendar integration (add to Apple Calendar / Google Calendar via deep link)
- **Key screens:** Booking confirmation, upcoming appointments list

#### Phase 4: Day-of Experience
- **Problem:** No check-in, no wait time visibility, no walk-in support.
- **Mobile solution:**
  - Geofenced auto check-in when customer arrives within 100m of the shop
  - Manual check-in button
  - Live wait time display (based on current appointments in Square)
  - Walk-in queue: join virtually, get notified when it is your turn
- **Key screens:** Check-in screen, wait time display, queue position

#### Phase 5: Post-Visit
- **Problem:** No feedback loop, no rebooking, no loyalty.
- **Mobile solution:**
  - Post-visit push notification: "How was your visit to [Shop]?" with star rating
  - Quick rebook: "Book the same service again?" with one-tap rebooking
  - Booking history with dates, services, barbers
  - Loyalty program: visit counter, rewards (managed by shop owner)
  - Photo gallery: save photos of haircuts for reference ("I want the same cut")
- **Key screens:** Review prompt, booking history, loyalty dashboard, style gallery

### 3.3 Critical Customer-Side Schema Additions Required

To support the customer journey, the database needs:

- **`customers`** table: `id`, `phone`, `email`, `name`, `auth_provider_id`, `avatar_url`, `created_at`
- **`customer_favorites`** table: `customer_id`, `shop_id`, `created_at`
- **`reviews`** table: `id`, `customer_id`, `shop_id`, `booking_id`, `rating`, `text`, `created_at`
- **`notifications`** table: `id`, `recipient_type` (customer/owner), `recipient_id`, `type`, `title`, `body`, `read`, `created_at`
- Modify **`bookings`** to add `customer_id` FK, `end_time`, `notes`, `checked_in_at`
- Add **`shop_profiles`** table for public-facing data: `shop_id`, `description`, `address`, `lat`, `lng`, `photos`, `logo_url`, `instagram_handle`

---

## 4. Shop Owner Journey Analysis

### 4.1 Current State

The shop owner journey is well-defined but desktop-centric:

1. **Sign up** via Clerk (email/password or social)
2. **Onboard** via 3-step wizard: Connect Square -> Customize Greeting -> Activate
3. **Monitor** via dashboard: Overview stats, call log, analytics charts
4. **Configure** via settings: Shop name, timezone, voice greeting, integrations
5. **Receive notifications** only via SMS when a new booking is created

### 4.2 Pain Points for Mobile

- The fixed-width sidebar is unusable on phones. Shop owners who are busy cutting hair cannot check their dashboard on a laptop mid-shift.
- Analytics charts (Recharts) are desktop-optimized. The 300px-height charts will be cramped on mobile.
- The "Talk to Agent" feature (testing the AI by talking to it in the browser) is actually ideal for mobile -- but the current implementation is buried in the dashboard overview, not prominently accessible.
- No push notifications. The only notification channel is SMS to the shop's phone number when a booking is created.
- No way to manage appointments (view upcoming, cancel, reschedule) from the dashboard at all. The bookings table exists in the database but there is no UI to display it.

### 4.3 Desired State for Shop Owners on Mobile

#### Real-time Notifications
- Push notification for every new booking with customer name, service, and time
- Push notification for cancellations
- Push notification for missed calls (calls that ended with "hangup" or "fallback" outcome)
- Daily summary notification: "Today: 5 appointments, 3 AI calls answered"

#### Quick-Glance Dashboard
- Today's schedule as a timeline (not a stat card)
- Next upcoming appointment prominently displayed
- Live call indicator when the AI is on a call
- Swipe-to-call-back on missed calls

#### Client Management
- View all clients who have booked (aggregated from bookings by phone number)
- Client notes (free text per client)
- Client visit history
- Quick message to client (SMS via Twilio)

#### Schedule Management
- View daily/weekly calendar of appointments
- Mark no-shows
- Block off time slots
- Manually add walk-in bookings

---

## 5. Mobile App Architecture Recommendations

### 5.1 Platform Recommendation: React Native with Expo

**Recommended approach:** React Native with Expo (SDK 52+)

**Rationale:**

| Factor | React Native + Expo | Flutter | PWA | Native (Swift/Kotlin) |
|--------|--------------------| --------|-----|-----------------------|
| Code sharing with Next.js web app | High -- shared TypeScript, shared API client, shared types, shared business logic | Low -- Dart is a completely different language | High -- same codebase with service worker | None |
| Push notifications | Excellent via expo-notifications | Excellent via firebase_messaging | Limited and unreliable on iOS | Excellent |
| Voice call integration (Vapi) | Vapi has a React Native SDK (`@vapi-ai/react-native`) | No official Vapi Flutter SDK | Vapi Web SDK works but microphone access is restricted in PWAs | Would require native Vapi integration |
| Offline capability | AsyncStorage + SQLite via expo-sqlite | Good via Hive/Isar | Limited to Cache API | Full native storage |
| Camera/photo access | expo-camera, expo-image-picker | camera plugin | Limited and requires HTTPS | Full native access |
| Location services | expo-location with background support | geolocator plugin | Geolocation API (no background) | Full native access |
| Time to market | Fast -- single codebase for iOS + Android | Fast -- single codebase | Fastest -- no app store | Slow -- two separate codebases |
| App Store presence | Yes | Yes | No (web only) | Yes |
| Development team alignment | Perfect -- existing team already uses React + TypeScript | Requires learning Dart | No additional learning | Requires Swift + Kotlin expertise |

**Why not PWA?** While a PWA would be fastest to ship and shares the most code, it fails on three critical requirements for BarberLine AI: (1) push notifications are unreliable on iOS Safari, (2) background location for geofenced check-in is not possible, and (3) App Store presence is important for discovery and credibility in the barbershop market.

**Why not Flutter?** Flutter is a strong framework, but the BarberLine AI team already has deep investment in TypeScript, React, and the npm ecosystem. Introducing Dart would split the team's expertise and eliminate code sharing.

### 5.2 Shared Codebase Strategy

```
barberline-ai/
  packages/
    shared/                    # NEW: shared TypeScript package
      src/
        types/                 # Supabase types, API response types (from src/lib/supabase/types.ts)
        api-client/            # Typed API client wrapping fetch() for all endpoints
        utils/                 # Shared utilities (date formatting, duration formatting)
        constants/             # Pricing plans, outcome labels, service defaults
    web/                       # Current Next.js app (moved from root)
      src/
        app/
        components/
        lib/
    mobile/                    # NEW: React Native Expo app
      src/
        screens/
        components/
        navigation/
        hooks/
        services/
```

**What to share:**
- TypeScript type definitions (`CallLog`, `Booking`, `Shop`, `CallOutcome`, etc.)
- API client functions (typed wrappers around `fetch()` for every `/api/*` endpoint)
- Business logic (outcome determination, duration formatting, time formatting)
- Constants (pricing plans, default greeting, outcome labels/badge colors)
- Validation schemas (if Zod is adopted)

**What stays platform-specific:**
- UI components (React DOM vs. React Native components)
- Navigation (Next.js App Router vs. React Navigation)
- Storage (cookies/localStorage vs. AsyncStorage/SecureStore)
- Auth flow (Clerk Next.js vs. Clerk Expo)
- Push notifications (N/A on web vs. expo-notifications)
- Voice integration (Vapi Web SDK vs. Vapi React Native SDK)

### 5.3 Monorepo Tooling

Use **Turborepo** to manage the monorepo. It integrates naturally with the existing Next.js setup and supports shared packages with TypeScript path aliases.

### 5.4 Offline Capabilities

| Feature | Offline Behavior | Sync Strategy |
|---------|-----------------|---------------|
| View upcoming appointments | Cached locally via AsyncStorage | Pull-to-refresh, background sync every 5 minutes |
| View call log | Last 50 calls cached | Append-only sync on reconnect |
| View analytics | Last-fetched data displayed with stale indicator | Re-fetch on reconnect |
| Book appointment | Not available offline (requires real-time Square availability) | Show "offline" state with retry |
| Receive push notifications | Notifications still arrive (handled by OS) | N/A |
| Talk to AI agent | Not available offline (requires real-time voice connection) | Show "offline" state |
| Shop settings | Cached for read, queue writes for sync | Optimistic update with rollback |

### 5.5 Push Notification Strategy

**Provider:** Expo Push Notifications (wraps APNs for iOS, FCM for Android)

**Notification Types for Shop Owners:**

| Event | Trigger | Priority | Payload |
|-------|---------|----------|---------|
| New booking | Booking created via AI or app | High | Customer name, service, date/time |
| Cancellation | Booking cancelled | High | Customer name, original time |
| Missed call | Call ends with `hangup` or `fallback` outcome | Normal | Caller phone, time |
| AI handled call | Call ends with any outcome | Low (silent) | Outcome, duration |
| Daily summary | Cron job at 8 AM shop timezone | Normal | Appointment count, call count |

**Notification Types for Customers:**

| Event | Trigger | Priority | Payload |
|-------|---------|----------|---------|
| Booking confirmed | Booking created | High | Shop name, service, date/time |
| 24-hour reminder | 24 hours before `start_time` | Normal | Shop name, service, time |
| 1-hour reminder | 1 hour before `start_time` | High | Shop name, service, "on your way?" |
| Review request | 2 hours after `start_time` | Low | Shop name, "How was your visit?" |
| Rebooking nudge | 3 weeks after last visit (configurable) | Low | Shop name, "Time for a trim?" |

**Implementation:** Add an `expo_push_tokens` table in Supabase. Use Supabase Edge Functions or a scheduled worker to trigger notifications based on booking events and time-based rules.

### 5.6 Voice Call Integration on Mobile

The Vapi AI voice call feature is the product's core differentiator and must be a first-class mobile experience.

**For Shop Owners (testing/demo):**
- Use `@vapi-ai/react-native` SDK to replicate the "Talk to Agent" button functionality
- Display real-time transcript in a chat-bubble UI (not the current desktop text log)
- Support background audio so the call continues if the owner switches apps

**For Customers (booking via voice):**
- Provide a "Call AI Receptionist" button on each shop profile
- The call happens in-app via Vapi, not via the phone dialer
- Show a call UI with mute, speaker, and end-call buttons
- Post-call, automatically navigate to the booking confirmation if a booking was made

**Technical requirements:**
- Microphone permission handling (`expo-av` or `@vapi-ai/react-native` handles this)
- Background audio mode enabled in `app.json`
- CallKit/ConnectionService integration for call UI on lock screen (stretch goal)

### 5.7 Deep Linking Strategy

**URL Scheme:** `barberline://`
**Universal Links:** `https://app.barberline.ai/`

| Deep Link | Action |
|-----------|--------|
| `barberline://shop/{shopId}` | Open shop profile |
| `barberline://booking/{bookingId}` | Open booking confirmation |
| `barberline://book/{shopId}` | Start booking flow for a shop |
| `barberline://calls` | Open call log (owner) |
| `barberline://dashboard` | Open dashboard (owner) |

**Use cases:**
- SMS booking confirmations include a deep link to view the booking in the app (with fallback to web)
- QR codes in the physical barbershop that open the shop profile for walk-in queue or rebooking
- Marketing emails with deep links to specific shops

---

## 6. Feature Recommendations for Mobile

### 6.1 Customer-Facing Features

#### Core (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| Shop discovery | Search by name, browse nearby (location-based) | P0 |
| Shop profile | Services, hours, team, photos, address with map | P0 |
| Browse availability | Calendar view of open slots per service/barber | P0 |
| Book appointment | Select service, barber, time; confirm booking | P0 |
| Voice booking | Tap-to-call AI receptionist from within the app | P0 |
| Booking confirmation | Confirmation screen with details + add-to-calendar | P0 |
| Upcoming appointments | List of confirmed upcoming bookings | P0 |
| Push notifications | Booking confirmations and reminders | P0 |
| Account & auth | Sign up / sign in via phone number (SMS OTP) | P0 |

#### Growth (V2)

| Feature | Description | Priority |
|---------|-------------|----------|
| Booking history | Past appointments with service/barber details | P1 |
| Favorite shops | Save frequently visited shops | P1 |
| Reviews & ratings | Rate visit, leave text review | P1 |
| Rebook same service | One-tap rebooking of the last appointment | P1 |
| Cancel/reschedule | Self-service modification from the app | P1 |
| Walk-in queue | Join a virtual walk-in queue at a shop | P1 |
| SMS-less onboarding | After a voice booking, receive an invite to create an account in the app linked to their phone number | P1 |

#### Differentiation (V3)

| Feature | Description | Priority |
|---------|-------------|----------|
| Style gallery | Save photos of haircuts; show barber the reference photo | P2 |
| Loyalty program | Visit counter, rewards defined by shop owner | P2 |
| Geofenced check-in | Auto check-in when arriving at the shop | P2 |
| Wait time estimate | Real-time wait based on current queue | P2 |
| Group booking | Book multiple chairs for a group (e.g., groomsmen) | P2 |
| Barber chat | In-app messaging with the barber (pre-visit questions) | P2 |

### 6.2 Shop Owner / Barber-Facing Features

#### Core (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| Daily schedule | Timeline view of today's appointments | P0 |
| Push notifications | New bookings, cancellations, missed calls | P0 |
| Stat overview | Today's calls, bookings, upcoming count | P0 |
| Call log | Scrollable list with outcome badges and transcript | P0 |
| Talk to AI agent | Test the AI receptionist via in-app voice call | P0 |
| Settings | Shop name, timezone, AI greeting | P0 |

#### Growth (V2)

| Feature | Description | Priority |
|---------|-------------|----------|
| Weekly calendar | Week-view schedule with drag-to-block-off | P1 |
| Client list | All clients aggregated from bookings by phone number | P1 |
| Client notes | Free-text notes per client (preferences, allergies, style notes) | P1 |
| Mark no-show | Tap to mark a booking as no-show | P1 |
| Analytics | 30-day charts (adapted for mobile viewport) | P1 |
| Quick actions | Call back missed caller, message client | P1 |

#### Differentiation (V3)

| Feature | Description | Priority |
|---------|-------------|----------|
| Earnings tracker | Daily/weekly/monthly revenue from bookings | P2 |
| Team management | Add/remove barbers, assign schedules | P2 |
| Walk-in queue management | See queue, call next, estimated wait | P2 |
| Loyalty program setup | Define rewards tiers and thresholds | P2 |
| Shop profile editor | Update photos, description, Instagram link | P2 |
| AI call playback | Listen to recorded calls (if Vapi provides recording URLs) | P2 |

### 6.3 Unique Mobile-Only Features

These features leverage mobile hardware capabilities that the web cannot match:

1. **Camera for style inspiration:** Customers photograph their desired haircut or take a selfie for the barber to reference. Stored in the booking record. Requires `expo-image-picker`.

2. **Location-based discovery:** "Barbershops near me" using GPS. Requires `expo-location` and a PostGIS-enabled query on the `shop_profiles` table.

3. **NFC tap-to-check-in:** Place an NFC tag at the shop entrance. Customers tap their phone to check in. Requires `react-native-nfc-manager`. (Stretch feature for V3.)

4. **Apple Watch / Wear OS widget:** Glanceable "next appointment" complication for customers and "next client" complication for barbers. (V3 stretch.)

5. **Haptic feedback on booking confirmation:** A satisfying haptic pulse when a booking is confirmed, reinforcing the action. Trivial to implement with `expo-haptics`.

6. **Siri/Google Assistant integration:** "Hey Siri, book a haircut at [shop name]." Requires Siri Shortcuts or Google Assistant App Actions. (V3 stretch.)

---

## 7. Technical Considerations

### 7.1 Authentication Flow on Mobile

**Clerk Expo SDK** (`@clerk/clerk-expo`) is the recommended auth library, maintaining consistency with the web app's Clerk integration.

**Customer auth flow (phone-first):**
1. Customer enters phone number
2. Clerk sends SMS OTP
3. Customer enters code
4. Account created or existing account matched
5. Supabase session token issued via Clerk JWT template (same pattern as the web app's `auth.jwt()->>'sub'`)

**Shop owner auth flow (email-first, matching web):**
1. Owner enters email/password or uses social sign-in (Google, Apple)
2. Clerk session established
3. Same JWT-to-Supabase flow as the web app

**Key implementation detail:** The existing Supabase RLS policies use `auth.jwt()->>'sub'` to match `clerk_user_id` on the `shops` table. For customer access, new RLS policies are needed that match on a `customer_id` column, with the Clerk user ID mapped to a customer record.

**Token storage:** Use `expo-secure-store` for the Clerk session token. Never store tokens in AsyncStorage (unencrypted).

### 7.2 API Compatibility Between Web and Mobile

The existing Next.js API routes serve two purposes:
1. **Dashboard APIs** (`/api/dashboard/*`) -- Clerk-authenticated, return JSON. These are directly consumable by the mobile app with no changes, as long as the Clerk session token is passed in the `Authorization` header.
2. **Vapi function call APIs** (`/api/vapi/*`) -- Server-to-server only, authenticated via Vapi secret. These should not be called from the mobile app directly.

**New APIs needed for mobile:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/shops/search` | GET | Search shops by name, location |
| `/api/shops/{id}/profile` | GET | Public shop profile |
| `/api/shops/{id}/services` | GET | List services with prices |
| `/api/shops/{id}/availability` | GET | Available slots for a date |
| `/api/shops/{id}/book` | POST | Create booking (customer-facing) |
| `/api/bookings/mine` | GET | Customer's bookings |
| `/api/bookings/{id}` | GET | Single booking detail |
| `/api/bookings/{id}/cancel` | POST | Cancel a booking |
| `/api/customers/me` | GET/PUT | Customer profile |
| `/api/push/register` | POST | Register push notification token |
| `/api/reviews` | POST | Submit a review |

**API versioning:** Introduce `/api/v1/` prefix for all new mobile APIs to allow breaking changes without affecting the web dashboard.

### 7.3 State Management

**Recommended: TanStack Query (React Query) for server state + Zustand for client state.**

- **TanStack Query** handles caching, background refetching, optimistic updates, and offline support. It is already conceptually aligned with the web app's data fetching patterns (server components that fetch from Supabase).
- **Zustand** for lightweight client-side state: current user, active call state, notification preferences, theme.

**Why not Redux?** Overkill for this app's state complexity. Zustand is simpler and has a smaller bundle size.

**Data flow:**
```
Supabase DB <-> Next.js API Routes <-> TanStack Query (mobile) <-> React Native UI
```

### 7.4 Performance and Battery Considerations

**Voice calls (Vapi):**
- Voice calls use WebRTC under the hood, which is CPU and battery intensive
- Implement call duration limits (e.g., 10-minute max for customer calls)
- Show battery warning if battery is below 20% when starting a call
- Use `expo-keep-awake` during active calls to prevent screen dimming

**Location services:**
- Use `expo-location` with `Accuracy.Balanced` (not `Accuracy.BestForNavigation`) for shop discovery
- Geofenced check-in should use iOS significant-location-change API (low battery impact) rather than continuous GPS polling
- Request location permission only when the user initiates a "nearby" search, not on app launch

**Background tasks:**
- Use `expo-task-manager` for background notification token refresh
- Avoid background fetch for analytics (not time-critical)
- Background audio only during active Vapi calls

**Network optimization:**
- Implement request deduplication via TanStack Query
- Use pagination for call logs (current web app loads 50 at once, which is fine for mobile)
- Compress images uploaded for style gallery before sending to server
- Use Supabase Realtime subscriptions sparingly (only for active call status, not for general data sync)

### 7.5 Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest (shared package) | Business logic, utilities, type guards |
| Component | React Native Testing Library | Individual screens and components |
| Integration | Detox or Maestro | End-to-end user flows (booking, auth, voice call) |
| API | Vitest (existing test suite) | All API routes |
| Manual | TestFlight (iOS), Internal Testing (Android) | Voice quality, push notification reliability, real-device testing |

---

## 8. Phased Rollout Plan

### Phase 1: Foundation (Weeks 1-6)

**Goal:** Ship a minimal shop-owner mobile app that replaces the need to check the web dashboard on a laptop.

**Deliverables:**
- Monorepo setup with Turborepo (`packages/shared`, `packages/web`, `packages/mobile`)
- Extract shared types and API client from current web app into `packages/shared`
- React Native Expo app scaffold with Clerk Expo auth
- Shop owner screens: dashboard overview, call log, settings
- Push notifications for new bookings
- "Talk to Agent" via Vapi React Native SDK
- TestFlight and internal Android distribution

**Team:** 2 React Native engineers, 1 backend engineer (API + push infra), 1 designer

### Phase 2: Customer MVP (Weeks 7-14)

**Goal:** Ship a customer-facing app with booking and voice AI.

**Deliverables:**
- Customer auth flow (phone number + SMS OTP)
- `customers` table and Supabase RLS policies
- Shop discovery (search by name; location-based requires `shop_profiles` with lat/lng)
- Shop profile screen
- Browse availability and book appointment (via new customer-facing API)
- Voice booking via Vapi (in-app call to AI receptionist)
- Booking confirmation with push notification
- Upcoming appointments screen
- SMS confirmation sent to customer (new Twilio integration)
- App Store and Google Play submission

**Team:** 2 React Native engineers, 1 backend engineer, 1 designer, 1 QA

### Phase 3: Engagement (Weeks 15-22)

**Goal:** Drive retention and repeat bookings.

**Deliverables:**
- Booking history
- Favorite shops
- Reviews and ratings
- Rebook same service
- Cancel/reschedule
- 24-hour and 1-hour reminder push notifications
- Shop owner: weekly calendar view, client list, client notes
- Shop owner: analytics (mobile-optimized charts)
- Deep linking from SMS confirmations

**Team:** 2 React Native engineers, 1 backend engineer, 1 designer

### Phase 4: Differentiation (Weeks 23-30)

**Goal:** Mobile-native features that create competitive moat.

**Deliverables:**
- Walk-in queue (customer join, owner manage)
- Style gallery (camera integration)
- Geofenced auto check-in
- Loyalty program
- Earnings tracker for barbers
- Shop profile editor
- AI call playback

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Vapi React Native SDK instability or limited feature set | Medium | High | Prototype voice calling in week 1. If the SDK is insufficient, fall back to a WebView wrapper for the Vapi Web SDK. |
| Clerk Expo SDK incompatibility with Supabase JWT flow | Low | High | The web app already proves the Clerk-to-Supabase JWT pattern works. Clerk Expo supports the same JWT templates. Test in week 1. |
| App Store rejection due to voice call feature (Apple may flag VoIP apps) | Medium | Medium | Document clearly that calls are to an AI assistant, not person-to-person VoIP. This is a standard use case (many AI assistant apps use similar patterns). Use CallKit for proper call integration. |
| Square API rate limits under mobile scale | Low | Medium | Square's API limits are generous (300 requests/min). Implement client-side caching of availability data (30-second TTL). |
| Customer adoption (two-sided marketplace cold start) | High | High | Launch with a "shop-first" strategy: onboard shops first, then incentivize shops to share their BarberLine profile link with existing clients. Do not depend on organic customer-side app discovery initially. |
| Scope creep from V3 features bleeding into V1 | Medium | Medium | Strict feature freeze per phase. Walk-in queue, loyalty, and geofencing are explicitly Phase 4. |
| Battery drain from voice calls reducing app ratings | Medium | Low | Implement call duration limits. Show estimated battery impact. Optimize Vapi SDK usage (disconnect WebRTC immediately on call end). |

---

## Appendix: Current Codebase Inventory

### File Count by Category

| Category | Count | Key Files |
|----------|-------|-----------|
| Marketing pages | 3 | Landing, How It Works, Pricing |
| Auth pages | 2 | Sign In, Sign Up |
| Dashboard pages | 6 | Overview, Onboarding, Calls, Analytics, Settings (General, Voice, Integrations), Billing |
| API routes | 13 | Dashboard (7), Square (2), Twilio (1), Vapi (5) |
| Dashboard components | 8 | Sidebar, StatCard, CallTable, Charts (2), OnboardingSteps, SettingsForm, SimulateCallButton, TalkToAgentButton |
| Marketing components | 2 | Header, Footer |
| UI primitives (shadcn) | 14 | Avatar, Badge, Button, Card, Dialog, DropdownMenu, Input, Label, Separator, Sheet, Skeleton, Sonner, Table, Tabs, Textarea |
| Lib modules | 10 | Supabase (client, server, types), Square (client, availability, booking, catalog), Vapi (create-agent, process-end-of-call, validate), Twilio (send-sms), utils, auth |
| Database migrations | 2 | Table creation, RLS policies |
| Test files | 12 | Unit and integration tests across API routes and components |

### Current Mobile Responsiveness Issues (Web App)

1. **Marketing header:** Navigation links hidden on mobile with no hamburger menu alternative. Users on phones cannot access "How It Works" or "Pricing" from the header.
2. **Dashboard sidebar:** Fixed `w-64` (256px) with no collapse/drawer behavior. On a 375px-wide phone, the sidebar alone exceeds the viewport.
3. **Dashboard layout:** `flex h-screen` with sidebar assumes desktop layout. No responsive breakpoint handling.
4. **Analytics charts:** Fixed `h-[300px]` containers work on desktop but leave charts cramped on mobile with truncated axis labels.
5. **Call log table:** Horizontal table layout will overflow on narrow screens. No card-based alternative for mobile.
6. **Auth pages:** Centered Clerk components with no branding context. Functional but visually disconnected.

These issues reinforce the recommendation for a dedicated mobile app rather than attempting to make the web app responsive. The web dashboard should remain a desktop-focused tool, while the mobile app provides a purpose-built experience for on-the-go usage.

---

*End of document. For questions or to discuss priorities, schedule a review session with the mobile architecture team.*
