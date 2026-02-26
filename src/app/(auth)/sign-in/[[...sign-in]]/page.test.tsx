import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SignInPage from "./page";

vi.mock("@clerk/nextjs", () => ({
  SignIn: (props: { afterSignInUrl?: string; appearance?: unknown }) => (
    <div
      data-testid="clerk-sign-in"
      data-after-sign-in-url={props.afterSignInUrl}
      data-has-appearance={props.appearance ? "true" : "false"}
    />
  ),
}));

describe("SignInPage", () => {
  it("renders Clerk SignIn component", () => {
    render(<SignInPage />);
    expect(screen.getByTestId("clerk-sign-in")).toBeInTheDocument();
  });

  it("redirects to /dashboard after sign-in", () => {
    render(<SignInPage />);
    expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute(
      "data-after-sign-in-url",
      "/dashboard"
    );
  });

  it("passes custom appearance to Clerk", () => {
    render(<SignInPage />);
    expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute(
      "data-has-appearance",
      "true"
    );
  });
});
