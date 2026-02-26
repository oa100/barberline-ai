# Light Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add light/dark theme switching with system preference as the default, using next-themes (already installed) and shadcn CSS variables.

**Architecture:** Wire up `next-themes` ThemeProvider in the root layout with `attribute="class"` so `.dark` class toggles on `<html>`. Define light-mode CSS variables in `:root` (currently dark values), keep `.dark` block for dark mode. Add a ThemeToggle component to the marketing header and dashboard sidebar.

**Tech Stack:** next-themes 0.4.x, Tailwind CSS v4, shadcn/ui CSS variables

---

### Task 1: ThemeProvider setup

**Files:**
- Create: `src/components/theme-provider.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create ThemeProvider wrapper**

Create `src/components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

**Step 2: Wrap root layout with ThemeProvider**

Modify `src/app/layout.tsx` — add `suppressHydrationWarning` to `<html>` (required by next-themes to inject the class before hydration) and wrap children in ThemeProvider:

```tsx
import { ThemeProvider } from "@/components/theme-provider";

// In the return:
<ClerkProvider>
  <html lang="en" suppressHydrationWarning>
    <body
      className={`${dmSans.variable} ${instrumentSerif.variable} font-sans antialiased`}
    >
      <ThemeProvider>
        {children}
        <ServiceWorkerRegister />
      </ThemeProvider>
    </body>
  </html>
</ClerkProvider>
```

**Step 3: Commit**

```bash
git add src/components/theme-provider.tsx src/app/layout.tsx
git commit -m "feat: add ThemeProvider with next-themes for light/dark mode"
```

---

### Task 2: Light mode CSS variables

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Replace `:root` with light theme values**

The `:root` block (lines 56-89) becomes the light theme. Replace with:

```css
:root {
  --radius: 0.625rem;
  --background: #FAFAF8;
  --foreground: #1A1A1A;
  --card: #FFFFFF;
  --card-foreground: #1A1A1A;
  --popover: #FFFFFF;
  --popover-foreground: #1A1A1A;
  --primary: #C8A55C;
  --primary-foreground: #FFFFFF;
  --secondary: #F0EDE6;
  --secondary-foreground: #1A1A1A;
  --muted: #F5F2EB;
  --muted-foreground: #6B6560;
  --accent: #F0EDE6;
  --accent-foreground: #1A1A1A;
  --destructive: oklch(0.577 0.245 27.325);
  --border: #E5E0D8;
  --input: #E5E0D8;
  --ring: #C8A55C;
  --chart-1: #C8A55C;
  --chart-2: #A8873E;
  --chart-3: #8B7539;
  --chart-4: #D4B76A;
  --chart-5: #6B5A2E;
  --sidebar: #F5F2EB;
  --sidebar-foreground: #1A1A1A;
  --sidebar-primary: #C8A55C;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #EBE7DF;
  --sidebar-accent-foreground: #1A1A1A;
  --sidebar-border: #E5E0D8;
  --sidebar-ring: #C8A55C;
}
```

**Step 2: Keep `.dark` block as-is** (lines 91-123 are already correct for dark mode)

**Step 3: Run tests**

```bash
npx vitest run
```

Expected: all existing tests pass (CSS changes don't break component tests)

**Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add light mode CSS variables"
```

---

### Task 3: ThemeToggle component + tests

**Files:**
- Create: `src/components/theme-toggle.tsx`
- Create: `src/components/theme-toggle.test.tsx`

**Step 1: Write the failing test**

Create `src/components/theme-toggle.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./theme-toggle";

const mockSetTheme = vi.fn();
let mockTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = "light";
  });

  it("renders a toggle button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("switches to dark when currently light", () => {
    mockTheme = "light";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("switches to light when currently dark", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/theme-toggle.test.tsx
```

Expected: FAIL — module not found

**Step 3: Create ThemeToggle component**

Create `src/components/theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/theme-toggle.test.tsx
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/components/theme-toggle.tsx src/components/theme-toggle.test.tsx
git commit -m "feat: add ThemeToggle component with tests"
```

---

### Task 4: Add toggle to marketing header

**Files:**
- Modify: `src/components/marketing/header.tsx`
- Modify: `src/components/marketing/header.test.tsx`

**Step 1: Update header test to expect theme toggle**

Add to `src/components/marketing/header.test.tsx`:

```tsx
// Add next-themes mock at the top with other mocks
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

// Add test
it("renders theme toggle button", () => {
  render(<Header />);
  expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/marketing/header.test.tsx
```

Expected: FAIL — no button with name "toggle theme"

**Step 3: Add ThemeToggle to header**

In `src/components/marketing/header.tsx`, import ThemeToggle and add it next to the "Log In" button in the desktop buttons section:

```tsx
import { ThemeToggle } from "@/components/theme-toggle";

// In the desktop buttons div (after the "Log In" Button, before "Get Started"):
<ThemeToggle />
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/marketing/header.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/marketing/header.tsx src/components/marketing/header.test.tsx
git commit -m "feat: add theme toggle to marketing header"
```

---

### Task 5: Add toggle to dashboard sidebar

**Files:**
- Modify: `src/components/dashboard/sidebar.tsx`
- Modify: `src/components/dashboard/sidebar.test.tsx`

**Step 1: Update sidebar test to expect theme toggle**

Add to `src/components/dashboard/sidebar.test.tsx`:

```tsx
// Add next-themes mock at the top with other mocks
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

// Add test
it("renders theme toggle button", () => {
  render(<Sidebar />);
  expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/dashboard/sidebar.test.tsx
```

Expected: FAIL

**Step 3: Add ThemeToggle to sidebar**

In `src/components/dashboard/sidebar.tsx`, add ThemeToggle next to UserButton:

```tsx
import { ThemeToggle } from "@/components/theme-toggle";

// Replace the user button div:
<div className="flex items-center justify-between border-t px-6 py-4">
  <UserButton afterSignOutUrl="/" />
  <ThemeToggle />
</div>
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/dashboard/sidebar.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/dashboard/sidebar.tsx src/components/dashboard/sidebar.test.tsx
git commit -m "feat: add theme toggle to dashboard sidebar"
```

---

### Task 6: Remove hardcoded dark colors

**Files:**
- Modify: `src/components/marketing/header.tsx`
- Modify: `src/app/(marketing)/layout.tsx`

**Step 1: Fix marketing layout**

In `src/app/(marketing)/layout.tsx`, replace `bg-[#0A0A0A]` with `bg-background`:

```tsx
<div className="relative flex min-h-screen flex-col bg-background">
```

**Step 2: Fix marketing header**

In `src/components/marketing/header.tsx`:

- Line 18: Replace `bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/80` with `bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80`
- Line 74: Replace `bg-[#0A0A0A]` in SheetContent with `bg-background`
- Line 57: Replace `text-[#0A0A0A]` with `text-primary-foreground` in Get Started button
- Line 107: Same for the mobile Get Started button
- Line 26: Replace `text-cream` with `text-foreground` for the logo text
- Line 67: Replace `text-cream` with `text-foreground` for mobile menu button

**Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass

**Step 4: Commit**

```bash
git add src/components/marketing/header.tsx src/app/\(marketing\)/layout.tsx
git commit -m "fix: replace hardcoded dark colors with theme-aware tokens"
```

---

### Task 7: Final verification

**Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

**Step 2: Visual check**

```bash
npm run dev
```

Verify:
- Default follows system preference
- Marketing site looks good in both light and dark
- Dashboard looks good in both light and dark
- Toggle works in marketing header
- Toggle works in dashboard sidebar
- No flash of wrong theme on page load
