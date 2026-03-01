import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingSteps } from "./onboarding-steps";

beforeEach(() => {
  vi.restoreAllMocks();
});

const defaultProps = {
  shopId: "shop-1",
  shopName: "My Barbershop",
  hasSquare: false,
};

describe("OnboardingSteps", () => {
  it("renders step 1 (Shop Details) by default", () => {
    render(<OnboardingSteps {...defaultProps} />);

    expect(screen.getByText("Shop Details")).toBeInTheDocument();
    expect(screen.getByLabelText("Shop Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Timezone")).toBeInTheDocument();

    // Step 2 (Connect Square) should not show its form
    expect(
      screen.queryByRole("link", { name: "Connect Square Account" })
    ).not.toBeInTheDocument();
  });

  it("starts at step 3 (greeting) when hasSquare=true", () => {
    render(<OnboardingSteps {...defaultProps} hasSquare={true} />);

    // Step 3 should show the greeting textarea
    expect(screen.getByLabelText("AI Greeting Message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("advances from step 1 to step 2 after saving shop details", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    render(<OnboardingSteps {...defaultProps} />);

    // Fill shop name
    fireEvent.change(screen.getByLabelText("Shop Name"), {
      target: { value: "King's Cuts" },
    });

    // Click Next to save
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      // Should now show Connect Square step
      expect(
        screen.getByRole("link", { name: "Connect Square Account" })
      ).toBeInTheDocument();
    });

    // Verify the Square link includes returnTo
    expect(
      screen.getByRole("link", { name: "Connect Square Account" })
    ).toHaveAttribute("href", "/api/square/oauth?returnTo=/dashboard/onboarding");
  });

  it("advances to step 4 (Go Live) from step 3", () => {
    render(<OnboardingSteps {...defaultProps} hasSquare={true} />);

    // Should be on step 3 (greeting)
    expect(screen.getByLabelText("AI Greeting Message")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Should now be on step 4
    expect(screen.queryByLabelText("AI Greeting Message")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Activate AI Receptionist" })
    ).toBeInTheDocument();
  });

  it("shows success state after activation", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, agentId: "agent_123" }),
    });

    render(<OnboardingSteps {...defaultProps} hasSquare={true} />);

    // Advance to step 4
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Click activate
    fireEvent.click(
      screen.getByRole("button", { name: "Activate AI Receptionist" })
    );

    await waitFor(() => {
      expect(screen.getByText("You are all set!")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: "Go to Dashboard" })
    ).toHaveAttribute("href", "/dashboard");
  });

  it("respects initialStep prop", () => {
    render(<OnboardingSteps {...defaultProps} initialStep={3} />);

    // Should show step 3 (greeting)
    expect(screen.getByLabelText("AI Greeting Message")).toBeInTheDocument();
  });
});
