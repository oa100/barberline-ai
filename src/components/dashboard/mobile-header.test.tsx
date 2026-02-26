import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileHeader } from "./mobile-header";

// Mock Clerk UserButton
vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button" />,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("MobileHeader", () => {
  it("renders hamburger button", () => {
    render(<MobileHeader />);
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("renders app title", () => {
    render(<MobileHeader />);
    expect(screen.getByText("BarberLine AI")).toBeInTheDocument();
  });

  it("renders user button", () => {
    render(<MobileHeader />);
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
  });
});
