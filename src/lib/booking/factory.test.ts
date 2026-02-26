import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/square/client", () => ({
  createSquareClient: vi.fn().mockReturnValue({}),
}));

import { getBookingProvider } from "./factory";
import { SquareProvider } from "./providers/square";

describe("getBookingProvider", () => {
  it("returns SquareProvider for provider_type 'square'", () => {
    const provider = getBookingProvider({
      provider_type: "square",
      provider_token: "test-token",
      provider_location_id: "LOC_1",
    });
    expect(provider).toBeInstanceOf(SquareProvider);
  });

  it("throws for unsupported provider_type", () => {
    expect(() =>
      getBookingProvider({
        provider_type: "unknown" as never,
        provider_token: "test-token",
        provider_location_id: "LOC_1",
      })
    ).toThrow("Unsupported booking provider: unknown");
  });

  it("throws when provider_token is missing", () => {
    expect(() =>
      getBookingProvider({
        provider_type: "square",
        provider_token: null,
        provider_location_id: "LOC_1",
      })
    ).toThrow("No booking provider configured");
  });

  it("throws when provider_location_id is missing", () => {
    expect(() =>
      getBookingProvider({
        provider_type: "square",
        provider_token: "test-token",
        provider_location_id: null,
      })
    ).toThrow("No booking provider configured");
  });
});
