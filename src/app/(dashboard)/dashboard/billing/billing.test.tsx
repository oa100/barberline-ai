import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/dashboard/auth", () => ({
  getAuthenticatedShop: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  Check: ({ className }: { className?: string }) => (
    <svg data-testid="check-icon" className={className} />
  ),
}));

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

// Mock client components
vi.mock("./checkout-button", () => ({
  CheckoutButton: ({ label }: { label: string }) => (
    <button data-testid="checkout-button">{label}</button>
  ),
}));

vi.mock("./portal-button", () => ({
  PortalButton: () => (
    <button data-testid="portal-button">Manage Subscription</button>
  ),
}));

import BillingPage from "./page";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";

describe("BillingPage", () => {
  it("renders billing heading", async () => {
    vi.mocked(getAuthenticatedShop).mockResolvedValue({
      id: "shop-1",
      name: "Test Shop",
      subscription_status: "trialing",
      subscription_tier: null,
      trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      stripe_customer_id: null,
    } as never);
    const Page = await BillingPage();
    render(Page);
    expect(screen.getByText("Billing")).toBeInTheDocument();
  });

  it("shows trial badge when trialing", async () => {
    vi.mocked(getAuthenticatedShop).mockResolvedValue({
      id: "shop-1",
      name: "Test Shop",
      subscription_status: "trialing",
      subscription_tier: null,
      trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      stripe_customer_id: null,
    } as never);
    const Page = await BillingPage();
    render(Page);
    expect(screen.getByText("Free Trial")).toBeInTheDocument();
  });

  it("shows active badge when subscribed", async () => {
    vi.mocked(getAuthenticatedShop).mockResolvedValue({
      id: "shop-1",
      name: "Test Shop",
      subscription_status: "active",
      subscription_tier: "pro",
      stripe_customer_id: "cus_123",
    } as never);
    const Page = await BillingPage();
    render(Page);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows plan cards when not subscribed", async () => {
    vi.mocked(getAuthenticatedShop).mockResolvedValue({
      id: "shop-1",
      name: "Test Shop",
      subscription_status: "trialing",
      subscription_tier: null,
      stripe_customer_id: null,
    } as never);
    const Page = await BillingPage();
    render(Page);
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("$99")).toBeInTheDocument();
  });
});
