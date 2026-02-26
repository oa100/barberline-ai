# PWA + Mobile Responsive Design

**Date:** February 26, 2026
**Status:** Approved

## Goal

Make BarberLine AI installable as a PWA and fully usable on mobile devices — both the shop owner dashboard and marketing pages.

## Architecture

Serwist for service worker generation + Next.js metadata API for manifest. Responsive refactor using existing Shadcn Sheet component for mobile sidebar. Card-based layouts replace tables on small screens. Marketing header gets a hamburger menu.

## PWA Infrastructure

- **Serwist** generates service worker with precaching (static assets) and runtime caching (API calls, network-first)
- **`src/app/manifest.ts`** exports manifest via Next.js metadata API
- `display: "standalone"`, `theme_color: "#1a1a1a"`, `background_color: "#0a0a0a"`, `start_url: "/dashboard"`
- Icons: 192x192, 512x512, apple-touch-icon 180x180 (gold/dark brand)
- Root layout: viewport meta, themeColor, apple-web-app meta tags
- Offline fallback page for disconnected state

## Responsive Dashboard Layout

- **Desktop (lg+):** Current behavior — fixed w-64 sidebar, p-8 content
- **Mobile (<lg):** Sidebar hidden, MobileHeader with hamburger, Sheet-based slide-out nav
- **MobileHeader:** sticky top bar, hamburger (left), title (center), user button (right), h-14
- **SidebarContent:** shared component used by both desktop sidebar and mobile Sheet
- Main content: `p-4 lg:p-8`, `pt-14 lg:pt-0`
- Sheet closes on nav item click

## Mobile Components

- **Call table:** card layout below md, table above md. Cards show caller + outcome, date + duration, tap to expand.
- **Analytics:** already responsive grids, adjust chart heights
- **Settings forms:** verify w-full inputs, 44px min tap targets
- **Action buttons:** `w-full sm:w-auto`

## Marketing Pages

- **Header:** hamburger menu on mobile using Sheet with nav links + CTA
- **Landing/pricing/footer:** verify stacking, fix any overflow issues

## Testing

- Chrome DevTools: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad)
- Lighthouse PWA audit: target 100
- Unit tests for MobileHeader and Sheet behavior
