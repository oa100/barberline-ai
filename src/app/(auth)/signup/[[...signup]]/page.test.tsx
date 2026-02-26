import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SignUpPage from "./page";

vi.mock("@clerk/nextjs", () => ({
  SignUp: (props: { afterSignUpUrl?: string; appearance?: unknown }) => (
    <div
      data-testid="clerk-sign-up"
      data-after-sign-up-url={props.afterSignUpUrl}
      data-has-appearance={props.appearance ? "true" : "false"}
    />
  ),
}));

describe("SignUpPage", () => {
  it("renders Clerk SignUp component", () => {
    render(<SignUpPage />);
    expect(screen.getByTestId("clerk-sign-up")).toBeInTheDocument();
  });

  it("redirects to onboarding after sign-up", () => {
    render(<SignUpPage />);
    expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute(
      "data-after-sign-up-url",
      "/dashboard/onboarding"
    );
  });

  it("passes custom appearance to Clerk", () => {
    render(<SignUpPage />);
    expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute(
      "data-has-appearance",
      "true"
    );
  });
});
