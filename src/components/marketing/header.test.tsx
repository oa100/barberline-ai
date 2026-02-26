import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./header";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Header", () => {
  it("renders logo with correct link", () => {
    render(<Header />);
    const logoLink = screen.getByRole("link", { name: /BarberLine/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders navigation links", () => {
    render(<Header />);
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });

  it("renders login and signup buttons with correct hrefs", () => {
    render(<Header />);
    const loginLink = screen.getByText("Log In").closest("a");
    expect(loginLink).toHaveAttribute("href", "/sign-in");

    const signupLink = screen.getByText("Get Started").closest("a");
    expect(signupLink).toHaveAttribute("href", "/signup");
  });

  it("renders hamburger menu button on mobile", () => {
    render(<Header />);
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });
});
