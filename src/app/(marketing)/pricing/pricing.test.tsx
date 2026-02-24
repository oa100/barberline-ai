import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PricingPage from "./page";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock lucide-react Check icon
vi.mock("lucide-react", () => ({
  Check: ({ className }: { className?: string }) => (
    <svg data-testid="check-icon" className={className} />
  ),
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

describe("PricingPage", () => {
  it("renders both plan names", () => {
    render(<PricingPage />);
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("renders correct prices", () => {
    render(<PricingPage />);
    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("$79")).toBeInTheDocument();
  });

  it("marks Pro plan as Most Popular", () => {
    render(<PricingPage />);
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("renders all feature items", () => {
    render(<PricingPage />);
    const starterFeatures = [
      "200 AI calls/mo",
      "Square booking",
      "SMS confirmations",
      "Call log",
      "Basic analytics",
    ];
    const proFeatures = [
      "All Starter features",
      "Unlimited calls",
      "Full analytics",
      "Custom voice/greeting",
      "Multi-barber routing",
      "Priority support",
    ];

    for (const feature of [...starterFeatures, ...proFeatures]) {
      expect(screen.getByText(feature)).toBeInTheDocument();
    }
  });
});
