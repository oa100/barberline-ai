import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SimulateCallButton } from "./simulate-call-button";

describe("SimulateCallButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the button", () => {
    render(<SimulateCallButton shopId="shop_1" />);
    expect(
      screen.getByRole("button", { name: /Simulate Call/i })
    ).toBeInTheDocument();
  });

  it("shows loading state when clicked", async () => {
    global.fetch = vi.fn().mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(<SimulateCallButton shopId="shop_1" />);
    fireEvent.click(screen.getByRole("button", { name: /Simulate Call/i }));

    expect(screen.getByRole("button", { name: /Calling/i })).toBeDisabled();
  });

  it("shows result summary on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          summary: "Simulated call from Marcus Johnson — booked (Classic Fade)",
        }),
    });

    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadMock },
      writable: true,
    });

    render(<SimulateCallButton shopId="shop_1" />);
    fireEvent.click(screen.getByRole("button", { name: /Simulate Call/i }));

    await waitFor(() => {
      expect(screen.getByText(/Marcus Johnson/)).toBeInTheDocument();
    });
  });

  it("shows error on failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Shop not found" }),
    });

    render(<SimulateCallButton shopId="shop_1" />);
    fireEvent.click(screen.getByRole("button", { name: /Simulate Call/i }));

    await waitFor(() => {
      expect(screen.getByText(/Error: Shop not found/)).toBeInTheDocument();
    });
  });
});
