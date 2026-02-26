import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock getAuthenticatedShop
vi.mock("@/lib/dashboard/auth", () => ({
  getAuthenticatedShop: vi.fn().mockResolvedValue({
    id: "shop-1",
    name: "Test Barbershop",
    clerk_user_id: "user-1",
  }),
}));

// Mock next/navigation redirect
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock radix-ui Slot used by Button
vi.mock("radix-ui", () => ({
  Slot: {
    Root: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <span {...props}>{children}</span>,
  },
}));

import BillingPage from "./page";

describe("BillingPage", () => {
  it("renders billing heading", async () => {
    const Page = await BillingPage();
    render(Page);
    expect(screen.getByText("Billing")).toBeInTheDocument();
  });

  it("renders Free Trial badge", async () => {
    const Page = await BillingPage();
    render(Page);
    expect(screen.getByText("Free Trial")).toBeInTheDocument();
  });

  it("renders both plan buttons with correct prices", async () => {
    const Page = await BillingPage();
    render(Page);
    expect(
      screen.getByRole("button", { name: "Starter — $49/mo" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pro — $99/mo" })
    ).toBeInTheDocument();
  });
});
