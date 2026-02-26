import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar, SidebarContent, navItems } from "./sidebar";

vi.mock("@clerk/nextjs", () => ({
  UserButton: (props: { afterSignOutUrl?: string }) => (
    <div data-testid="user-button" data-after-sign-out-url={props.afterSignOutUrl} />
  ),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

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

describe("Sidebar", () => {
  it("renders the logo linking to dashboard", () => {
    render(<Sidebar />);
    const logo = screen.getByText("BarberLine AI");
    expect(logo.closest("a")).toHaveAttribute("href", "/dashboard");
  });

  it("renders UserButton for sign-out", () => {
    render(<Sidebar />);
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
  });

  it("redirects to / after sign-out", () => {
    render(<Sidebar />);
    expect(screen.getByTestId("user-button")).toHaveAttribute(
      "data-after-sign-out-url",
      "/"
    );
  });

  it("renders all navigation items", () => {
    render(<Sidebar />);
    for (const item of navItems) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it("renders theme toggle button", () => {
    render(<Sidebar />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("highlights active route", () => {
    render(<Sidebar />);
    const overviewLink = screen.getByText("Overview").closest("a");
    expect(overviewLink?.className).toContain("bg-primary");
  });
});

describe("SidebarContent", () => {
  it("renders navigation links with correct hrefs", () => {
    render(<SidebarContent />);
    for (const item of navItems) {
      const link = screen.getByText(item.label).closest("a");
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("calls onNavigate when link is clicked", () => {
    const onNavigate = vi.fn();
    render(<SidebarContent onNavigate={onNavigate} />);
    screen.getByText("Calls").click();
    expect(onNavigate).toHaveBeenCalled();
  });
});
