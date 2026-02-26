# Theme A: Clean Minimal + Bold Type — Design & Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current luxury barbershop aesthetic with a clean, minimal Framer/Linear-inspired design. New accent color (warm amber), sans-serif-only typography, pill buttons, no decorative elements.

**Architecture:** CSS variable swap in globals.css + Tailwind class changes across marketing pages and components. ThemeProvider and toggle infrastructure already exists from feature/light-mode.

**Tech Stack:** Tailwind CSS v4, next-themes, shadcn/ui CSS variables

---

## Color Palette

### Light Mode
| Token | Value | Usage |
|-------|-------|-------|
| --background | #FFFFFF | Page background |
| --foreground | #0C0C0C | Primary text |
| --card | #FFFFFF | Card backgrounds |
| --card-foreground | #0C0C0C | Card text |
| --popover | #FFFFFF | Popover bg |
| --popover-foreground | #0C0C0C | Popover text |
| --primary | #D97706 | Accent (warm amber) |
| --primary-foreground | #FFFFFF | Text on accent |
| --secondary | #F5F5F4 | Section backgrounds |
| --secondary-foreground | #0C0C0C | Text on sections |
| --muted | #F5F5F4 | Muted backgrounds |
| --muted-foreground | #6B7280 | Secondary text |
| --accent | #F5F5F4 | Accent backgrounds |
| --accent-foreground | #0C0C0C | Text on accent bg |
| --border | #E5E7EB | Borders |
| --input | #E5E7EB | Input borders |
| --ring | #D97706 | Focus rings |
| --gold | #D97706 | Brand accent (replaces gold) |
| --gold-light | #F59E0B | Lighter accent |
| --gold-dark | #B45309 | Darker accent |
| --cream | #0C0C0C | Heading text (adapts to foreground) |
| --warm-gray | #6B7280 | Secondary text |

### Dark Mode
| Token | Value | Usage |
|-------|-------|-------|
| --background | #09090B | Page background |
| --foreground | #FAFAFA | Primary text |
| --card | #18181B | Card backgrounds |
| --card-foreground | #FAFAFA | Card text |
| --popover | #18181B | Popover bg |
| --popover-foreground | #FAFAFA | Popover text |
| --primary | #F59E0B | Accent (amber, brighter for dark) |
| --primary-foreground | #09090B | Text on accent |
| --secondary | #18181B | Section backgrounds |
| --secondary-foreground | #FAFAFA | Text on sections |
| --muted | #27272A | Muted backgrounds |
| --muted-foreground | #A1A1AA | Secondary text |
| --accent | #27272A | Accent backgrounds |
| --accent-foreground | #FAFAFA | Text on accent bg |
| --border | #27272A | Borders |
| --input | #27272A | Input borders |
| --ring | #F59E0B | Focus rings |
| --gold | #F59E0B | Brand accent |
| --gold-light | #FCD34D | Lighter accent |
| --gold-dark | #D97706 | Darker accent |
| --cream | #FAFAFA | Heading text |
| --warm-gray | #A1A1AA | Secondary text |

### Sidebar (Light)
| Token | Value |
|-------|-------|
| --sidebar | #F5F5F4 |
| --sidebar-foreground | #0C0C0C |
| --sidebar-primary | #D97706 |
| --sidebar-primary-foreground | #FFFFFF |
| --sidebar-accent | #E5E5E4 |
| --sidebar-accent-foreground | #0C0C0C |
| --sidebar-border | #E5E7EB |
| --sidebar-ring | #D97706 |

### Sidebar (Dark)
| Token | Value |
|-------|-------|
| --sidebar | #0F0F11 |
| --sidebar-foreground | #FAFAFA |
| --sidebar-primary | #F59E0B |
| --sidebar-primary-foreground | #09090B |
| --sidebar-accent | #27272A |
| --sidebar-accent-foreground | #FAFAFA |
| --sidebar-border | #27272A |
| --sidebar-ring | #F59E0B |

### Chart Colors
Light: #D97706, #B45309, #92400E, #F59E0B, #78350F
Dark: #F59E0B, #FCD34D, #D97706, #FBBF24, #B45309

---

## Typography Changes

- **Headings:** Replace `font-serif` (Instrument Serif) with `font-sans font-bold` (DM Sans bold) everywhere
- **Letter spacing:** Tighter on headings — replace `tracking-wide`/`tracking-[0.25em]` with `tracking-tight`
- **Uppercase labels:** Keep uppercase for small eyebrow text, but use `tracking-[0.1em]` instead of `tracking-[0.25em]`

---

## UI Element Changes

- **Buttons:** Replace `rounded-none` with `rounded-full` (pill shape) on all marketing buttons
- **Cards:** Replace `border border-gold/10` with `border border-border` — clean, subtle
- **Barber stripes:** Remove all `.barber-stripe` and `.barber-stripe-thin` usage from marketing pages
- **Grain overlay:** Remove `.grain-overlay` from marketing layout
- **Shimmer text:** Replace `.text-shimmer` with simple `text-primary` — no animation
- **Gold line:** Replace `.gold-line` with a simple `border-b border-border`
- **Card glow:** Replace `.card-glow` hover effect with simple `hover:border-primary/50 hover:shadow-sm` transition
- **Decorative corners:** Remove the absolute-positioned corner decorations from feature cards

---

## Tasks

### Task 1: Update globals.css with new palette and remove decorative CSS

**Files:**
- Modify: `src/app/globals.css`

**Steps:**
1. Replace `:root` block with the Light Mode values from the palette table above
2. Replace `.dark` block with the Dark Mode values from the palette table above
3. Update `--radius` to `9999px` for pill-shaped default (or keep 0.625rem and handle per-component — recommend keeping 0.625rem and using rounded-full on buttons only)
4. Replace `.barber-stripe` gradient colors with `var(--gold)` references (or remove if not used after Task 3)
5. Replace `.text-shimmer` gradient colors: use `var(--gold)` and `var(--gold-light)`
6. Replace `.gold-line` gradient colors with `var(--gold)` references
7. Replace `.card-glow:hover` box-shadow gold references with `var(--gold)` or primary color
8. Run tests, commit

### Task 2: Update marketing layout (remove grain overlay)

**Files:**
- Modify: `src/app/(marketing)/layout.tsx`

**Steps:**
1. Remove the `<div className="grain-overlay" />` element
2. Run tests, commit

### Task 3: Update homepage (page.tsx)

**Files:**
- Modify: `src/app/(marketing)/page.tsx`

**Steps:**
1. Replace all `font-serif` with `font-sans font-bold` on headings
2. Replace all `rounded-none` with `rounded-full` on buttons
3. Replace `tracking-[0.25em]` with `tracking-[0.1em]` on eyebrow text
4. Replace `tracking-[0.15em]` with `tracking-wide` on buttons
5. Remove barber stripe elements: the `<div className="barber-stripe-thin h-3 w-3 rounded-full" />` in eyebrow, the `<div className="absolute bottom-0 left-0 right-0 barber-stripe h-1 opacity-40" />` at hero bottom, and the `<div className="mx-auto mt-16 barber-stripe-thin h-1 w-32 opacity-40 rounded-full" />` at CTA bottom
6. Remove background barber stripe: `<div className="absolute inset-0 barber-stripe opacity-[0.02]" />`
7. Replace `text-shimmer` class on "booking" with `text-primary`
8. Replace `.gold-line` div with a simple `<div className="mx-auto mt-6 w-16 border-b-2 border-primary" />`
9. On feature cards: replace `border border-gold/10 bg-card` with `border border-border bg-card`, remove the decorative corner div, replace `card-glow` with `hover:border-primary/30 transition-colors`
10. On feature icons: replace `border border-gold/20 bg-gold/5` with `bg-primary/10 rounded-full`
11. Run tests, commit

### Task 4: Update marketing header

**Files:**
- Modify: `src/components/marketing/header.tsx`

**Steps:**
1. Replace `font-serif` with `font-sans font-bold` on logo text
2. Replace `rounded-none` with `rounded-full` on "Get Started" buttons (desktop + mobile)
3. Replace `tracking-[0.15em]` with `tracking-wide`
4. Remove the barber pole icon div (the `<div className="relative h-8 w-3 overflow-hidden rounded-full">` with barber-stripe inside)
5. Run tests, commit

### Task 5: Update remaining marketing pages

**Files:**
- Modify: `src/app/(marketing)/pricing/page.tsx`
- Modify: `src/app/(marketing)/how-it-works/page.tsx`
- Modify: `src/app/(marketing)/about/page.tsx`
- Modify: `src/app/(marketing)/contact/page.tsx`
- Modify: `src/app/(marketing)/terms/page.tsx`
- Modify: `src/app/(marketing)/privacy/page.tsx`

**Steps:**
For each file:
1. Replace all `font-serif` with `font-sans font-bold` on headings
2. Replace all `rounded-none` with `rounded-full` on buttons
3. Replace any remaining `tracking-[0.25em]` with `tracking-[0.1em]`
4. Replace any remaining `tracking-[0.15em]` with `tracking-wide`
5. Remove any barber stripe elements
6. Run tests, commit

### Task 6: Update footer

**Files:**
- Modify: `src/components/marketing/footer.tsx`

**Steps:**
1. Replace `font-serif` with `font-sans font-bold` on logo text
2. Remove barber stripe if present
3. Run tests, commit

### Task 7: Update auth pages

**Files:**
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(auth)/clerk-theme.ts`

**Steps:**
1. Replace `font-serif` with `font-sans font-bold` in auth layout
2. Update Clerk theme variables: `colorPrimary` from gold to amber `#D97706`
3. Update Clerk element classes: `rounded-none` to `rounded-full` on buttons
4. Run tests, commit

### Task 8: Update dashboard sidebar

**Files:**
- Modify: `src/components/dashboard/sidebar.tsx`

**Steps:**
1. Replace `font-bold` logo text — no changes needed unless it uses `font-serif`
2. Verify sidebar looks correct with new palette (mostly automatic via CSS variables)
3. Run tests, commit

### Task 9: Final verification

**Steps:**
1. Run full test suite
2. Visual check in both light and dark mode
3. Verify all pages: home, pricing, how-it-works, about, contact, terms, privacy, sign-in, sign-up, dashboard
