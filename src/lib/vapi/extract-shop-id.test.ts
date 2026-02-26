import { describe, it, expect } from "vitest";
import { extractShopId } from "./extract-shop-id";

describe("extractShopId", () => {
  it("returns metadata shopId when both match", () => {
    const result = extractShopId({
      message: {
        functionCall: { parameters: { shopId: "shop_1" } },
        assistant: { metadata: { shopId: "shop_1" } },
      },
    });
    expect(result).toEqual({ shopId: "shop_1", mismatch: false });
  });

  it("returns mismatch when metadata and parameter shopId differ", () => {
    const result = extractShopId({
      message: {
        functionCall: { parameters: { shopId: "attacker-shop" } },
        assistant: { metadata: { shopId: "real-shop" } },
      },
    });
    expect(result).toEqual({ shopId: null, mismatch: true });
  });

  it("uses metadata shopId when parameter is missing", () => {
    const result = extractShopId({
      message: {
        functionCall: { parameters: {} },
        assistant: { metadata: { shopId: "shop_1" } },
      },
    });
    expect(result).toEqual({ shopId: "shop_1", mismatch: false });
  });

  it("uses parameter shopId when metadata is missing", () => {
    const result = extractShopId({
      message: {
        functionCall: { parameters: { shopId: "shop_1" } },
        assistant: { metadata: {} },
      },
    });
    expect(result).toEqual({ shopId: "shop_1", mismatch: false });
  });

  it("returns null shopId when both are missing", () => {
    const result = extractShopId({
      message: {
        functionCall: { parameters: {} },
        assistant: { metadata: {} },
      },
    });
    expect(result).toEqual({ shopId: null, mismatch: false });
  });
});
