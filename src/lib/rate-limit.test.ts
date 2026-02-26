import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within the limit", () => {
    const config = { limit: 3, windowMs: 60_000 };

    expect(rateLimit("test-key", config).success).toBe(true);
    expect(rateLimit("test-key", config).success).toBe(true);
    expect(rateLimit("test-key", config).success).toBe(true);
  });

  it("blocks requests exceeding the limit", () => {
    const config = { limit: 2, windowMs: 60_000 };

    rateLimit("block-key", config);
    rateLimit("block-key", config);

    const result = rateLimit("block-key", config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const config = { limit: 1, windowMs: 60_000 };

    rateLimit("reset-key", config);
    expect(rateLimit("reset-key", config).success).toBe(false);

    vi.advanceTimersByTime(61_000);

    expect(rateLimit("reset-key", config).success).toBe(true);
  });

  it("tracks different keys independently", () => {
    const config = { limit: 1, windowMs: 60_000 };

    rateLimit("key-a", config);
    expect(rateLimit("key-b", config).success).toBe(true);
  });
});
