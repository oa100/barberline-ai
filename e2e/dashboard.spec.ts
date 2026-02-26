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
