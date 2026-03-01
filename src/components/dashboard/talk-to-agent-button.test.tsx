import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TalkToAgentButton } from "./talk-to-agent-button";

// Mock the Vapi web SDK
vi.mock("@vapi-ai/web", () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      setMuted: vi.fn(),
      on: vi.fn(),
    };
  }),
}));

const defaultProps = {
  shopId: "shop_1",
};

describe("TalkToAgentButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("NEXT_PUBLIC_VAPI_PUBLIC_KEY", "test-public-key");
  });

  it("renders the Talk to Agent button", () => {
    render(<TalkToAgentButton {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Talk to Agent/i })
    ).toBeInTheDocument();
  });

  it("shows alert when public key is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_VAPI_PUBLIC_KEY", "");
    const alertMock = vi.fn();
    global.alert = alertMock;

    render(<TalkToAgentButton {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Talk to Agent/i }));

    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_VAPI_PUBLIC_KEY")
    );
  });

  it("shows connecting state when call starts", async () => {
    // Mock fetch for the vapi-token endpoint
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          assistant: {
            name: "Test AI",
            firstMessage: "Hello!",
            model: { provider: "openai", model: "gpt-4o", messages: [] },
            voice: { provider: "11labs", voiceId: "test" },
          },
        }),
    });

    render(<TalkToAgentButton {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Talk to Agent/i }));

    // Should show connecting state
    expect(
      screen.getByRole("button", { name: /Connecting/i })
    ).toBeInTheDocument();
  });

  it("does not render transcript when no messages", () => {
    render(<TalkToAgentButton {...defaultProps} />);
    // No transcript div should be visible
    expect(screen.queryByText("AI:")).not.toBeInTheDocument();
    expect(screen.queryByText("You:")).not.toBeInTheDocument();
  });
});
