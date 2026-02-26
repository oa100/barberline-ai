import { test, expect } from "@playwright/test";

const BASE_URL = "https://barberline-ai.vercel.app";

test.describe("Marketing Pages", () => {
  test("landing page loads with hero and CTA", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/BarberLine AI/);
    await expect(
      page.locator("text=Never miss a booking again")
    ).toBeVisible();
    await expect(page.locator("text=Start Free Trial").first()).toBeVisible();
  });

  test("landing page has all sections", async ({ page }) => {
    await page.goto(BASE_URL);
    // Problem section
    await expect(
      page.locator("text=You're mid-cut. The phone rings...")
    ).toBeVisible();
    await expect(page.locator("text=40-60% of incoming calls")).toBeVisible();
    // Features section
    await expect(page.locator("text=24/7 Call Answering")).toBeVisible();
    await expect(page.locator("text=Instant Booking")).toBeVisible();
    await expect(page.locator("text=SMS Confirmations")).toBeVisible();
    await expect(page.locator("text=Call Analytics")).toBeVisible();
    // CTA section
    await expect(
      page.locator("text=Ready to stop losing customers?")
    ).toBeVisible();
  });

  test("header has navigation links", async ({ page }) => {
    await page.goto(BASE_URL);
    const header = page.locator("header");
    await expect(header.getByText("How It Works")).toBeVisible();
    await expect(header.getByText("Pricing")).toBeVisible();
    await expect(header.getByText("Log In")).toBeVisible();
    await expect(header.getByText("Get Started")).toBeVisible();
  });

  test("pricing page loads with plans", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
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
    await page.goto(`${BASE_URL}/how-it-works`);
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
    await page.goto(`${BASE_URL}/pricing`);
    await expect(
      page.locator("text=Simple, transparent pricing")
    ).toBeVisible();
  });

  test("can navigate to how-it-works page directly", async ({ page }) => {
    await page.goto(`${BASE_URL}/how-it-works`);
    await expect(
      page.getByRole("heading", { name: "How it works" })
    ).toBeVisible();
  });

  test("footer links are present", async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText("BarberLine AI", { exact: true }).first()).toBeVisible();
    await expect(footer.getByText("How It Works")).toBeVisible();
    await expect(footer.getByText("Pricing")).toBeVisible();
  });
});

test.describe("API Routes", () => {
  test("vapi webhook returns 401 without secret", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/vapi/webhook`, {
      data: { message: { type: "test" } },
    });
    expect(res.status()).toBe(401);
  });

  test("dashboard API returns error without auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/dashboard/calls`);
    // Without Clerk configured, returns 401 or 500
    expect([401, 500]).toContain(res.status());
  });
});

test.describe("Screenshots", () => {
  test("capture landing page screenshot", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "e2e/screenshots/landing.png",
      fullPage: true,
    });
  });

  test("capture pricing page screenshot", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "e2e/screenshots/pricing.png",
      fullPage: true,
    });
  });

  test("capture how-it-works screenshot", async ({ page }) => {
    await page.goto(`${BASE_URL}/how-it-works`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "e2e/screenshots/how-it-works.png",
      fullPage: true,
    });
  });
});
