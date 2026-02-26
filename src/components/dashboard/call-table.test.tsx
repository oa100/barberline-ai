import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CallTable, formatDuration } from "./call-table";
import type { CallLog } from "@/lib/supabase/types";

function makeCall(overrides: Partial<CallLog> = {}): CallLog {
  return {
    id: "call-1",
    shop_id: "shop-1",
    vapi_call_id: "vapi-1",
    caller_phone: "+15551234567",
    duration_sec: 125,
    outcome: "booked",
    transcript: { summary: "Customer booked a haircut for Tuesday." },
    created_at: "2026-02-24T10:30:00Z",
    ...overrides,
  };
}

describe("CallTable", () => {
  it("renders empty state when no calls", () => {
    render(<CallTable calls={[]} />);
    expect(screen.getByText("No calls yet")).toBeInTheDocument();
  });

  it("renders call rows with correct data", () => {
    const call = makeCall();
    render(<CallTable calls={[call]} />);

    // Both mobile card and desktop table render, so use getAllByText
    expect(screen.getAllByText("+15551234567").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2:05").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Booked").length).toBeGreaterThanOrEqual(1);
  });

  it("shows correct badge for each outcome type", () => {
    const outcomes: Array<{
      outcome: CallLog["outcome"];
      label: string;
      variant: string;
    }> = [
      { outcome: "booked", label: "Booked", variant: "default" },
      {
        outcome: "no_availability",
        label: "No Availability",
        variant: "secondary",
      },
      { outcome: "fallback", label: "Fallback", variant: "outline" },
      { outcome: "hangup", label: "Hangup", variant: "destructive" },
      { outcome: "info_only", label: "Info Only", variant: "secondary" },
    ];

    const calls = outcomes.map((o, i) =>
      makeCall({ id: `call-${i}`, outcome: o.outcome }),
    );

    render(<CallTable calls={calls} />);

    for (const { label, variant } of outcomes) {
      const badges = screen.getAllByText(label);
      expect(badges.length).toBeGreaterThanOrEqual(1);
      // Check that at least one badge has the correct variant
      const hasCorrectVariant = badges.some(
        (badge) => badge.getAttribute("data-variant") === variant,
      );
      expect(hasCorrectVariant).toBe(true);
    }
  });

  it("expands transcript on row click", () => {
    const call = makeCall({
      transcript: { summary: "Customer booked a haircut for Tuesday." },
    });
    render(<CallTable calls={[call]} />);

    // Transcript summary should not be visible initially
    expect(
      screen.queryByText("Customer booked a haircut for Tuesday."),
    ).not.toBeInTheDocument();

    // Click the row to expand
    const row = screen.getByTestId("call-row-call-1");
    fireEvent.click(row);

    // Transcript summary should now be visible (in both mobile card and table)
    expect(
      screen.getAllByText("Customer booked a haircut for Tuesday.").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("formats duration correctly", () => {
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(61)).toBe("1:01");
    expect(formatDuration(null)).toBe("0:00");
    expect(formatDuration(3599)).toBe("59:59");
  });

  it("renders mobile call cards", () => {
    const call = makeCall();
    render(<CallTable calls={[call]} />);

    // Mobile cards should exist alongside table (CSS handles visibility)
    const mobileCard = screen.getByTestId("call-card-call-1");
    expect(mobileCard).toBeInTheDocument();
  });
});
