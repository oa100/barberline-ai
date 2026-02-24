import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Footer } from "./footer";

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

describe("Footer", () => {
  it("renders product links", () => {
    render(<Footer />);
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });

  it("renders copyright text", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(
      screen.getByText(`\u00A9 ${year} BarberLine AI. All rights reserved.`)
    ).toBeInTheDocument();
  });
});
