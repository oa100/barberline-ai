# PWA + Mobile Responsive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make BarberLine AI installable as a PWA and fully responsive on mobile — dashboard and marketing pages.

**Architecture:** Next.js built-in manifest API + manual service worker (no Serwist — Next.js 16 official docs recommend manual SW for simplicity). Responsive layout using existing Shadcn Sheet component for mobile sidebar. Card-based call log on mobile.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS 4, Shadcn UI (Sheet, existing components), Vitest

---

### Task 1: PWA Manifest + Viewport Meta

**Files:**
- Create: `src/app/manifest.ts`
- Modify: `src/app/layout.tsx`

**Step 1: Create the manifest file**

Create `src/app/manifest.ts`:

```typescript
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BarberLine AI",
    short_name: "BarberLine",
    description:
      "AI voice agent that answers calls, books appointments, and manages your barbershop 24/7.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#1a1a1a",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
```

**Step 2: Update root layout metadata**

In `src/app/layout.tsx`, update the metadata export:

```typescript
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a1a1a",
};

export const metadata: Metadata = {
  title: "BarberLine AI — Never Miss a Booking Again",
  description:
    "AI voice agent that answers calls, books appointments, and manages your barbershop 24/7.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BarberLine AI",
  },
};
```

**Step 3: Run the dev server and verify manifest loads**

Run: `npx next dev`
Visit: `http://localhost:3000/manifest.webmanifest`
Expected: JSON manifest with name, icons, display: standalone

**Step 4: Commit**

```bash
git add src/app/manifest.ts src/app/layout.tsx
git commit -m "feat: add PWA manifest and viewport meta"
```

---

### Task 2: PWA Icons

**Files:**
- Create: `public/icon-192x192.png`
- Create: `public/icon-512x512.png`
- Create: `public/apple-touch-icon.png`

**Step 1: Generate PWA icons**

We need three icon sizes. Since we don't have a design tool, create simple placeholder icons using a script. These should be dark background (#0a0a0a) with gold text "BL".

For now, create placeholder SVG-based PNGs. The user can replace these with proper branded icons later.

Use this Node.js script to generate them (run once):

```bash
node -e "
const { createCanvas } = require('canvas');
// If canvas is not available, create simple placeholder files
const fs = require('fs');
const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];
// Create minimal 1x1 PNG placeholders — replace with real icons
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
]);
for (const { name } of sizes) {
  if (!fs.existsSync('public/' + name)) {
    // Copy favicon as placeholder
    fs.copyFileSync('public/favicon.ico', 'public/' + name);
    console.log('Created placeholder: ' + name);
  }
}
"
```

> **Note:** These are placeholders. Replace with properly designed brand icons (gold barber pole on dark background) before production launch. Icons must be the exact pixel dimensions specified.

**Step 2: Update manifest to include apple-touch-icon**

In `src/app/layout.tsx`, add to metadata:

```typescript
export const metadata: Metadata = {
  title: "BarberLine AI — Never Miss a Booking Again",
  description:
    "AI voice agent that answers calls, books appointments, and manages your barbershop 24/7.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BarberLine AI",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};
```

**Step 3: Commit**

```bash
git add public/icon-192x192.png public/icon-512x512.png public/apple-touch-icon.png src/app/layout.tsx
git commit -m "feat: add PWA icons (placeholders — replace with branded versions)"
```

---

### Task 3: Service Worker + Offline Fallback

**Files:**
- Create: `public/sw.js`
- Modify: `src/app/layout.tsx` (add SW registration)
- Modify: `next.config.ts` (add SW headers)

**Step 1: Create the service worker**

Create `public/sw.js`:

```javascript
const CACHE_NAME = "barberline-v1";
const OFFLINE_URL = "/offline";

// Pre-cache the offline page on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first strategy for navigation, cache fallback to offline page
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
```

**Step 2: Create offline fallback page**

Create `src/app/offline/page.tsx`:

```typescript
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6">
      <div className="text-center">
        <h1 className="mb-4 font-serif text-3xl text-cream">
          You&apos;re Offline
        </h1>
        <p className="text-warm-gray">
          BarberLine AI needs an internet connection. Please check your
          connection and try again.
        </p>
      </div>
    </div>
  );
}
```

**Step 3: Register the service worker from root layout**

Create `src/components/sw-register.tsx`:

```typescript
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("SW registration failed:", err);
      });
    }
  }, []);

  return null;
}
```

Add to `src/app/layout.tsx` body:

```typescript
import { ServiceWorkerRegister } from "@/components/sw-register";

// Inside the body tag, after {children}:
<ServiceWorkerRegister />
```

**Step 4: Add SW-specific headers to next.config.ts**

Add a new source block to the existing `headers()` function in `next.config.ts`:

```typescript
{
  source: "/sw.js",
  headers: [
    { key: "Content-Type", value: "application/javascript; charset=utf-8" },
    { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
  ],
},
```

**Step 5: Verify SW registers**

Run: `npx next dev`
Open DevTools → Application → Service Workers
Expected: SW registered and active

**Step 6: Commit**

```bash
git add public/sw.js src/app/offline/page.tsx src/components/sw-register.tsx src/app/layout.tsx next.config.ts
git commit -m "feat: add service worker with offline fallback"
```

---

### Task 4: Responsive Dashboard Layout — SidebarContent + MobileHeader

This is the biggest task. We refactor the sidebar into a shared `SidebarContent` component, create a `MobileHeader` with hamburger, and update the dashboard layout.

**Files:**
- Modify: `src/components/dashboard/sidebar.tsx`
- Create: `src/components/dashboard/mobile-header.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

**Step 1: Write tests for MobileHeader**

Create `src/components/dashboard/mobile-header.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileHeader } from "./mobile-header";

// Mock Clerk UserButton
vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button" />,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("MobileHeader", () => {
  it("renders hamburger button", () => {
    render(<MobileHeader />);
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("renders app title", () => {
    render(<MobileHeader />);
    expect(screen.getByText("BarberLine AI")).toBeInTheDocument();
  });

  it("renders user button", () => {
    render(<MobileHeader />);
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/dashboard/mobile-header.test.tsx`
Expected: FAIL — module not found

**Step 3: Extract SidebarContent and create MobileHeader**

Refactor `src/components/dashboard/sidebar.tsx`:

```typescript
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
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calls", href: "/dashboard/calls", icon: Phone },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export { navItems };

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          BarberLine AI
        </Link>
      </div>

      <SidebarContent />

      {/* User button */}
      <div className="border-t px-6 py-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  );
}
```

Create `src/components/dashboard/mobile-header.tsx`:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="text-lg font-bold">
          BarberLine AI
        </Link>

        <UserButton afterSignOutUrl="/" />
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="text-xl font-bold"
              >
                BarberLine AI
              </Link>
            </SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
```

**Step 4: Update dashboard layout**

Replace `src/app/(dashboard)/layout.tsx`:

```typescript
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile header — hidden on desktop */}
      <MobileHeader />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
```

**Step 5: Run tests**

Run: `npx vitest run src/components/dashboard/mobile-header.test.tsx`
Expected: 3 tests PASS

Run: `npx vitest run`
Expected: All existing tests still pass

**Step 6: Commit**

```bash
git add src/components/dashboard/sidebar.tsx src/components/dashboard/mobile-header.tsx src/components/dashboard/mobile-header.test.tsx src/app/(dashboard)/layout.tsx
git commit -m "feat: add responsive dashboard layout with mobile sidebar"
```

---

### Task 5: Mobile-Friendly Call Table

Add a card-based layout for the call log on mobile screens, keeping the table on desktop.

**Files:**
- Modify: `src/components/dashboard/call-table.tsx`
- Modify: `src/components/dashboard/call-table.test.tsx`

**Step 1: Add test for mobile card rendering**

Add to `src/components/dashboard/call-table.test.tsx`:

```typescript
it("renders mobile call cards", () => {
  const call = makeCall();
  render(<CallTable calls={[call]} />);

  // Mobile cards should exist alongside table (CSS handles visibility)
  const mobileCard = screen.getByTestId("call-card-call-1");
  expect(mobileCard).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/dashboard/call-table.test.tsx`
Expected: FAIL — testid not found

**Step 3: Add mobile card layout to CallTable**

In `src/components/dashboard/call-table.tsx`, wrap the existing Table in a `hidden md:block` div, and add a mobile card list above it with `md:hidden`:

```typescript
export function CallTable({ calls }: CallTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (calls.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No calls yet
      </div>
    );
  }

  return (
    <>
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {calls.map((call) => {
          const isExpanded = expandedId === call.id;
          const summary = getTranscriptSummary(call.transcript);

          return (
            <div
              key={call.id}
              data-testid={`call-card-${call.id}`}
              className="rounded-lg border bg-card p-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : call.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {call.caller_phone ?? "Unknown"}
                </span>
                <Badge variant={outcomeBadgeVariant[call.outcome]}>
                  {outcomeLabel[call.outcome]}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {new Date(call.created_at).toLocaleDateString()}
                </span>
                <span>{formatDuration(call.duration_sec)}</span>
              </div>
              {isExpanded && summary && (
                <div className="mt-3 rounded bg-muted/50 p-3 text-sm text-muted-foreground">
                  {summary}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block">
        <Table>
          {/* ... existing table code unchanged ... */}
        </Table>
      </div>
    </>
  );
}
```

**Step 4: Run tests**

Run: `npx vitest run src/components/dashboard/call-table.test.tsx`
Expected: All tests PASS (existing + new mobile card test)

**Step 5: Commit**

```bash
git add src/components/dashboard/call-table.tsx src/components/dashboard/call-table.test.tsx
git commit -m "feat: add mobile card layout for call log table"
```

---

### Task 6: Marketing Header Mobile Navigation

**Files:**
- Modify: `src/components/marketing/header.tsx`
- Modify: `src/components/marketing/header.test.tsx`

**Step 1: Add test for mobile menu**

Add to existing test file `src/components/marketing/header.test.tsx`:

```typescript
it("renders hamburger menu button on mobile", () => {
  render(<Header />);
  expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/marketing/header.test.tsx`
Expected: FAIL — no element with aria-label "Open menu"

**Step 3: Add mobile menu to header**

Read the current `src/components/marketing/header.tsx` and add:
- A hamburger button visible only on mobile (`md:hidden`)
- A Sheet that opens from the right with nav links (How It Works, Pricing) and CTA buttons (Log In, Get Started)
- Sheet closes on link click

Update `src/components/marketing/header.tsx`:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gold/10 bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/80">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Barber pole icon */}
            <div className="relative h-8 w-3 overflow-hidden rounded-full">
              <div className="barber-stripe absolute inset-0" />
            </div>
            <span className="font-serif text-2xl tracking-wide text-cream">
              BarberLine <span className="text-gold">AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/how-it-works"
              className="text-sm font-medium tracking-wide text-warm-gray uppercase transition-colors hover:text-gold"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium tracking-wide text-warm-gray uppercase transition-colors hover:text-gold"
            >
              Pricing
            </Link>
          </nav>
        </div>

        {/* Desktop buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            asChild
            className="text-warm-gray hover:text-cream hover:bg-transparent"
          >
            <Link href="/sign-in">Log In</Link>
          </Button>
          <Button
            asChild
            className="bg-gold text-[#0A0A0A] font-semibold hover:bg-gold-light rounded-none px-6 tracking-wide uppercase text-xs"
          >
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-md md:hidden text-cream hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="right" className="w-72 bg-[#0A0A0A] border-gold/10">
            <SheetHeader className="border-b border-gold/10 pb-4">
              <SheetTitle className="font-serif text-xl text-cream">
                BarberLine <span className="text-gold">AI</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 pt-6">
              <Link
                href="/how-it-works"
                onClick={() => setOpen(false)}
                className="text-sm font-medium tracking-wide text-warm-gray uppercase transition-colors hover:text-gold"
              >
                How It Works
              </Link>
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="text-sm font-medium tracking-wide text-warm-gray uppercase transition-colors hover:text-gold"
              >
                Pricing
              </Link>
              <div className="mt-4 flex flex-col gap-3 border-t border-gold/10 pt-6">
                <Button
                  variant="ghost"
                  asChild
                  className="w-full justify-center text-warm-gray hover:text-cream hover:bg-transparent"
                >
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    Log In
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-gold text-[#0A0A0A] font-semibold hover:bg-gold-light rounded-none px-6 tracking-wide uppercase text-xs"
                >
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
```

> **Important:** This adds `"use client"` to the header since it now uses `useState`. Check that the existing header test imports still work with the client component.

**Step 4: Run tests**

Run: `npx vitest run src/components/marketing/header.test.tsx`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/components/marketing/header.tsx src/components/marketing/header.test.tsx
git commit -m "feat: add mobile hamburger menu to marketing header"
```

---

### Task 7: Mobile Touch Targets + Action Button Sizing

Quick pass to ensure all interactive elements meet 44px minimum tap target and action buttons are full-width on mobile.

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (or wherever SimulateCallButton / TalkToAgentButton are rendered)

**Step 1: Find and update button containers**

Search for `SimulateCallButton` and `TalkToAgentButton` usage in dashboard pages. Wrap them in a container with `flex flex-col sm:flex-row gap-3` so they stack vertically on mobile.

**Step 2: Add responsive classes to the buttons themselves**

If the buttons have fixed widths, change to `w-full sm:w-auto`.

**Step 3: Verify visually**

Run: `npx next dev`
Check at 375px viewport: buttons should be full-width, tappable

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: mobile-friendly action buttons and touch targets"
```

---

### Task 8: Full Test Suite + Verification

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Verify PWA with dev server**

Run: `npx next dev`

Check these at 375px viewport width in Chrome DevTools:
- [ ] Dashboard sidebar is hidden, hamburger menu works
- [ ] Sheet slides from left with nav links
- [ ] Call table shows cards, not table
- [ ] Marketing header has hamburger menu
- [ ] Marketing Sheet slides from right with links
- [ ] Action buttons are full-width
- [ ] All pages are scrollable, no horizontal overflow

**Step 3: Verify PWA manifest**

Visit: `/manifest.webmanifest`
Expected: Valid JSON with name, icons, display: standalone

**Step 4: Check Lighthouse PWA audit**

Run: Chrome DevTools → Lighthouse → PWA category
Expected: Installable (manifest + service worker present)

**Step 5: Final commit if cleanup needed**

```bash
git add -A
git commit -m "chore: final PWA + mobile responsive cleanup"
```
