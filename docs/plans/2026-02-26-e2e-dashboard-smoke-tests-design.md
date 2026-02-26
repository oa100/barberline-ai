# E2E Dashboard Smoke Tests — Design

## Goal

Add Playwright E2E tests for authenticated dashboard flows to catch integration bugs (like the booked count query mismatch) that unit tests with mocked dependencies cannot detect.

## Architecture

- **Auth:** Clerk's `@clerk/testing` package with `setupClerkTestingToken()` bypasses bot detection. Each test calls it before navigating.
- **Target:** Local dev server (`http://localhost:3000`) by default, configurable via `BASE_URL` env var.
- **Framework:** Playwright (already installed, extends existing `e2e/` setup).

## File Changes

- `playwright.config.ts` — Update baseURL to use env var, add webServer config for local dev
- `e2e/dashboard.spec.ts` — New file with authenticated dashboard tests
- `e2e/smoke.spec.ts` — Keep as-is for marketing pages (update BASE_URL to use config baseURL)
- `package.json` — Add `@clerk/testing` dependency, add `test:e2e` script

## Test Cases

### Dashboard Overview (3 tests)

1. **Dashboard loads with stat cards** — Navigate to `/dashboard`, verify welcome heading, all 3 stat cards ("Calls Today", "Booked Today", "Upcoming") are visible.
2. **Simulate Call increments Calls Today** — Record initial "Calls Today" value, click "Simulate Call", wait for page reload, verify count increased by 1.
3. **Booked call increments Booked Today** — This is the exact bug we caught. Click "Simulate Call" multiple times until a "booked" outcome appears, verify "Booked Today" increments.

### Call Log Page (2 tests)

4. **Call log shows simulated calls** — Navigate to `/dashboard/calls` via sidebar, verify "Call Log" heading, verify at least one call row exists (from previous simulate tests).
5. **Transcript expands on click** — Click a call row, verify transcript text becomes visible.

### Navigation & Pages (2 tests)

6. **Sidebar navigation works** — Click each sidebar link (Calls, Analytics, Settings, Billing), verify correct page heading appears.
7. **Analytics page renders charts** — Navigate to `/dashboard/analytics`, verify stat cards and chart containers ("Call Volume", "Peak Hours") are visible.

## Prerequisites

- `CLERK_TESTING_TOKEN` env var (from Clerk dev instance dashboard)
- A test user that has completed onboarding (has a shop with data)
- Local dev server running or `webServer` config handles it

## What This Catches

- Query targeting wrong table (the booked count bug)
- API route returning wrong data shape
- Dashboard not reflecting actual database state after actions
- Navigation/routing regressions
- Chart rendering failures (black charts bug)
