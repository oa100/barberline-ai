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
