import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingSteps } from "./onboarding-steps";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("OnboardingSteps", () => {
  it("renders step 1 (Connect Square) when hasSquare=false", () => {
    render(<OnboardingSteps shopId="shop-1" hasSquare={false} />);

    expect(screen.getByText("Connect Square")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Connect Square Account" })
    ).toHaveAttribute("href", "/api/square/oauth");

    // Step 2 should not show its form
    expect(screen.queryByLabelText("AI Greeting Message")).not.toBeInTheDocument();
  });

  it("starts at step 2 when hasSquare=true", () => {
    render(<OnboardingSteps shopId="shop-1" hasSquare={true} />);

    // Step 1 should show green checkmark (completed)
    // Step 2 should show the greeting textarea
    expect(screen.getByLabelText("AI Greeting Message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("advances to step 3 when Next is clicked on step 2", () => {
    render(<OnboardingSteps shopId="shop-1" hasSquare={true} />);

    // Should be on step 2
    expect(screen.getByLabelText("AI Greeting Message")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Should now be on step 3
    expect(screen.queryByLabelText("AI Greeting Message")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Activate AI Receptionist" })
    ).toBeInTheDocument();
  });

  it("shows success state after activation", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    render(<OnboardingSteps shopId="shop-1" hasSquare={true} />);

    // Advance to step 3
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
});
