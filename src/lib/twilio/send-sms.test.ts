import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn().mockResolvedValue({ sid: "SM123" });

vi.mock("twilio", () => ({
  default: vi.fn(() => ({
    messages: { create: mockCreate },
  })),
}));

import { sendSms } from "./send-sms";

describe("sendSms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC_test");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "auth_test");
    vi.stubEnv("TWILIO_PHONE_NUMBER", "+10000000000");
  });

  it("sends an SMS via Twilio client", async () => {
    await sendSms({ to: "+15551234567", body: "Hello there" });

    expect(mockCreate).toHaveBeenCalledWith({
      to: "+15551234567",
      from: "+10000000000",
      body: "Hello there",
    });
  });

  it("throws when Twilio fails", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Twilio error"));

    await expect(
      sendSms({ to: "+15551234567", body: "Hello" })
    ).rejects.toThrow("Twilio error");
  });

  it("is not exposed as an HTTP endpoint", async () => {
    // Verify this is a plain function, not an HTTP route handler
    expect(typeof sendSms).toBe("function");
    // The function should not return a Response object
    const result = await sendSms({ to: "+15551234567", body: "Test" });
    expect(result).not.toBeInstanceOf(Response);
  });
});
