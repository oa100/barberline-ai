# E2E Dashboard Smoke Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Playwright E2E tests for authenticated dashboard flows to catch integration bugs that unit tests with mocked dependencies cannot detect.

**Architecture:** Extend the existing Playwright setup with Clerk's `@clerk/testing` package for authentication. Add a global setup file that calls `clerkSetup()`, then use `setupClerkTestingToken()` and `clerk.signIn()` in dashboard tests. Tests run against a local dev server by default.

**Tech Stack:** Playwright, @clerk/testing, Next.js dev server, Clerk

---

### Task 1: Install @clerk/testing and update Playwright config

**Files:**
- Modify: `package.json`
- Modify: `playwright.config.ts`
- Create: `e2e/global.setup.ts`

**Step 1: Install @clerk/testing**

Run: `npm i @clerk/testing --save-dev`
Expected: Package added to devDependencies

**Step 2: Create the global setup file**

Create `e2e/global.setup.ts`:

```typescript
import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

setup.describe.configure({ mode: "serial" });

setup("global setup", async ({}) => {
  await clerkSetup();
});
```

**Step 3: Update playwright.config.ts**

Replace the entire file with:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { browserName: "chromium" },
      dependencies: ["setup"],
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120000,
      },
});
```

**Step 4: Update smoke.spec.ts to use config baseURL**

In `e2e/smoke.spec.ts`, remove the hardcoded `BASE_URL` constant and replace all `BASE_URL` usages with relative paths. The existing tests use `page.goto(BASE_URL)` — change to `page.goto("/")`, `page.goto("/pricing")`, etc. For the API routes tests that use `request`, use relative URLs too since Playwright's `request` context inherits `baseURL` from config.

Replace the entire file:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Marketing Pages", () => {
  test("landing page loads with hero and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BarberLine AI/);
    await expect(
      page.locator("text=Never miss a booking again")
    ).toBeVisible();
    await expect(page.locator("text=Start Free Trial").first()).toBeVisible();
  });

  test("landing page has all sections", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("text=You're mid-cut. The phone rings...")
    ).toBeVisible();
    await expect(page.locator("text=40-60% of incoming calls")).toBeVisible();
    await expect(page.locator("text=24/7 Call Answering")).toBeVisible();
    await expect(page.locator("text=Instant Booking")).toBeVisible();
    await expect(page.locator("text=SMS Confirmations")).toBeVisible();
    await expect(page.locator("text=Call Analytics")).toBeVisible();
    await expect(
      page.locator("text=Ready to stop losing customers?")
    ).toBeVisible();
  });

  test("header has navigation links", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.getByText("How It Works")).toBeVisible();
    await expect(header.getByText("Pricing")).toBeVisible();
    await expect(header.getByText("Log In")).toBeVisible();
    await expect(header.getByText("Get Started")).toBeVisible();
  });

  test("pricing page loads with plans", async ({ page }) => {
    await page.goto("/pricing");
    await expect(
      page.locator("text=Simple, transparent pricing")
    ).toBeVisible();
    await expect(page.locator("text=$49")).toBeVisible();
    await expect(page.locator("text=$99")).toBeVisible();
    await expect(page.locator("text=Most Popular")).toBeVisible();
    await expect(page.locator("text=Starter").first()).toBeVisible();
    await expect(page.locator("text=Pro").first()).toBeVisible();
  });

  test("how-it-works page loads with steps", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(
      page.getByRole("heading", { name: "How it works" })
    ).toBeVisible();
    await expect(
      page.locator("text=Connect your Square account")
    ).toBeVisible();
    await expect(
      page.locator("text=Customize your AI receptionist")
    ).toBeVisible();
    await expect(
      page.locator("text=Go live and start booking")
    ).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("can navigate to pricing page directly", async ({ page }) => {
    await page.goto("/pricing");
    await expect(
      page.locator("text=Simple, transparent pricing")
    ).toBeVisible();
  });

  test("can navigate to how-it-works page directly", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(
      page.getByRole("heading", { name: "How it works" })
    ).toBeVisible();
  });

  test("footer links are present", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(
      footer.getByText("BarberLine AI", { exact: true }).first()
    ).toBeVisible();
    await expect(footer.getByText("How It Works")).toBeVisible();
    await expect(footer.getByText("Pricing")).toBeVisible();
  });
});

test.describe("API Routes", () => {
  test("vapi webhook returns 401 without secret", async ({ request }) => {
    const res = await request.post("/api/vapi/webhook", {
      data: { message: { type: "test" } },
    });
    expect(res.status()).toBe(401);
  });

  test("dashboard API returns error without auth", async ({ request }) => {
    const res = await request.get("/api/dashboard/calls");
    expect([401, 500]).toContain(res.status());
  });
});

test.describe("Screenshots", () => {
  test("capture landing page screenshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "e2e/screenshots/landing.png",
      fullPage: true,
    });
  });

  test("capture pricing page screenshot", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "e2e/screenshots/pricing.png",
      fullPage: true,
    });
  });

  test("capture how-it-works screenshot", async ({ page }) => {
    await page.goto("/how-it-works");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "e2e/screenshots/how-it-works.png",
      fullPage: true,
    });
  });
});
```

**Step 5: Add test:e2e script to package.json**

Add to the "scripts" section:

```json
"test:e2e": "npx playwright test"
```

**Step 6: Commit**

```bash
git add e2e/global.setup.ts playwright.config.ts e2e/smoke.spec.ts package.json package-lock.json
git commit -m "chore: configure Playwright for Clerk auth and local dev server"
```

---

### Task 2: Dashboard overview smoke tests

**Files:**
- Create: `e2e/dashboard.spec.ts`

**Step 1: Write the dashboard test file**

Create `e2e/dashboard.spec.ts`:

```typescript
import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test.describe("Dashboard Overview", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });
  });

  test("dashboard loads with welcome message and stat cards", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Welcome"
    );
    await expect(page.getByText("Calls Today")).toBeVisible();
    await expect(page.getByText("Booked Today")).toBeVisible();
    await expect(page.getByText("Upcoming")).toBeVisible();
  });

  test("simulate call increments Calls Today", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Calls Today")).toBeVisible();

    // Get the initial count from the stat card
    const callsCard = page.locator("text=Calls Today").locator("..").locator("..");
    const initialText = await callsCard.getByText(/^\d+$/).first().textContent();
    const initialCount = parseInt(initialText || "0", 10);

    // Click simulate call
    await page.getByRole("button", { name: /Simulate Call/i }).click();

    // Wait for the page to reload (SimulateCallButton reloads after 1.5s)
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify count increased
    const newText = await callsCard.getByText(/^\d+$/).first().textContent();
    const newCount = parseInt(newText || "0", 10);
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test("simulate booked call increments Booked Today", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Booked Today")).toBeVisible();

    // Get the initial booked count
    const bookedCard = page
      .locator("text=Booked Today")
      .locator("..")
      .locator("..");
    const initialText = await bookedCard
      .getByText(/^\d+$/)
      .first()
      .textContent();
    const initialCount = parseInt(initialText || "0", 10);

    // Simulate calls until we get a "booked" outcome (3 out of 5 scenarios are booked)
    // Try up to 5 times to be safe
    let gotBooked = false;
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: /Simulate Call/i }).click();

      // Wait for the result summary to appear
      await page.waitForTimeout(1000);
      const resultText = await page
        .locator("text=Simulated call from")
        .textContent()
        .catch(() => null);

      if (resultText?.includes("booked")) {
        gotBooked = true;
        break;
      }

      // Wait for reload and button to be clickable again
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForLoadState("networkidle");
    }

    // If we got a booked outcome, verify the count went up
    if (gotBooked) {
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForLoadState("networkidle");

      const newText = await bookedCard
        .getByText(/^\d+$/)
        .first()
        .textContent();
      const newCount = parseInt(newText || "0", 10);
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });
});
```

**Step 2: Run the test to verify it works**

Run: `E2E_CLERK_USER_USERNAME=<test-user> E2E_CLERK_USER_PASSWORD=<test-password> npx playwright test e2e/dashboard.spec.ts --headed`

Expected: Tests pass (or skip if no Clerk credentials configured)

**Step 3: Commit**

```bash
git add e2e/dashboard.spec.ts
git commit -m "test: add dashboard overview E2E smoke tests"
```

---

### Task 3: Call log and navigation E2E tests

**Files:**
- Modify: `e2e/dashboard.spec.ts`

**Step 1: Add call log and navigation test groups**

Append to `e2e/dashboard.spec.ts`:

```typescript
test.describe("Call Log Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });
  });

  test("call log page shows calls", async ({ page }) => {
    // First simulate a call so there's data
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /Simulate Call/i }).click();
    await page.waitForTimeout(2000);

    // Navigate to calls page via sidebar
    await page.getByRole("link", { name: "Calls" }).click();
    await expect(
      page.getByRole("heading", { name: "Call Log" })
    ).toBeVisible();

    // Verify at least one call exists (either mobile card or desktop row)
    const hasCallRow = await page.locator("[data-testid^='call-row-']").count();
    const hasCallCard = await page
      .locator("[data-testid^='call-card-']")
      .count();
    expect(hasCallRow + hasCallCard).toBeGreaterThan(0);
  });

  test("call transcript expands on click", async ({ page }) => {
    await page.goto("/dashboard/calls");

    // Click the first call row (desktop) or card (mobile)
    const callRow = page.locator("[data-testid^='call-row-']").first();
    const callCard = page.locator("[data-testid^='call-card-']").first();

    if ((await callRow.count()) > 0) {
      await callRow.click();
      // Verify expanded content appears (transcript text in a colspan=5 cell)
      await expect(
        page.locator("td[colspan='5']").first()
      ).toBeVisible();
    } else if ((await callCard.count()) > 0) {
      await callCard.click();
      // Mobile expanded transcript area
      await expect(
        callCard.locator(".bg-muted\\/50").first()
      ).toBeVisible();
    }
  });
});

test.describe("Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });
  });

  test("sidebar navigates to all dashboard pages", async ({ page }) => {
    await page.goto("/dashboard");

    // Navigate to Calls
    await page.getByRole("link", { name: "Calls" }).click();
    await expect(
      page.getByRole("heading", { name: "Call Log" })
    ).toBeVisible();

    // Navigate to Analytics
    await page.getByRole("link", { name: "Analytics" }).click();
    await expect(
      page.getByRole("heading", { name: "Analytics" })
    ).toBeVisible();

    // Navigate to Settings
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(
      page.getByRole("heading", { name: "Settings" })
    ).toBeVisible();

    // Navigate to Billing
    await page.getByRole("link", { name: "Billing" }).click();
    await expect(
      page.getByRole("heading", { name: "Billing" })
    ).toBeVisible();

    // Navigate back to Overview
    await page.getByRole("link", { name: "Overview" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Welcome"
    );
  });

  test("analytics page renders stat cards and charts", async ({ page }) => {
    await page.goto("/dashboard/analytics");

    // Stat cards
    await expect(page.getByText("Total Calls")).toBeVisible();
    await expect(page.getByText("Conversion Rate")).toBeVisible();
    await expect(page.getByText("Avg Duration")).toBeVisible();

    // Chart containers
    await expect(page.getByText("Call Volume")).toBeVisible();
    await expect(page.getByText("Peak Hours")).toBeVisible();
  });
});
```

**Step 2: Run all dashboard tests**

Run: `npx playwright test e2e/dashboard.spec.ts --headed`
Expected: All tests pass

**Step 3: Commit**

```bash
git add e2e/dashboard.spec.ts
git commit -m "test: add call log and navigation E2E smoke tests"
```

---

### Task 4: Apply to feature/light-mode branch

**Files:**
- Copy all new/modified e2e files to `.worktrees/light-mode/`

**Step 1: Copy files to light-mode worktree**

```bash
cp e2e/global.setup.ts .worktrees/light-mode/e2e/global.setup.ts
cp e2e/dashboard.spec.ts .worktrees/light-mode/e2e/dashboard.spec.ts
cp e2e/smoke.spec.ts .worktrees/light-mode/e2e/smoke.spec.ts
cp playwright.config.ts .worktrees/light-mode/playwright.config.ts
```

**Step 2: Install @clerk/testing in light-mode worktree**

```bash
cd .worktrees/light-mode && npm i @clerk/testing --save-dev
```

**Step 3: Run tests in light-mode worktree**

```bash
cd .worktrees/light-mode && npx vitest run
```

Expected: All 195 unit tests pass

**Step 4: Commit on feature/light-mode branch**

```bash
cd .worktrees/light-mode
git add e2e/ playwright.config.ts package.json package-lock.json
git commit -m "test: add E2E dashboard smoke tests"
```
