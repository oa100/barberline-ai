import { describe, it, expect } from "vitest";
import nextConfig from "../next.config";

describe("next.config.ts security headers", () => {
  it("defines security headers via the headers function", async () => {
    expect(nextConfig.headers).toBeDefined();
    expect(typeof nextConfig.headers).toBe("function");
  });

  it("includes all required security headers", async () => {
    const headerSets = await nextConfig.headers!();
    // Find the catch-all route
    const catchAll = headerSets.find((h: { source: string }) => h.source === "/(.*)")!;
    expect(catchAll).toBeDefined();

    const headerMap = Object.fromEntries(
      catchAll.headers.map((h: { key: string; value: string }) => [h.key, h.value])
    );

    expect(headerMap["X-Content-Type-Options"]).toBe("nosniff");
    expect(headerMap["X-Frame-Options"]).toBe("DENY");
    expect(headerMap["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headerMap["Permissions-Policy"]).toContain("microphone=(self)");
    expect(headerMap["Strict-Transport-Security"]).toContain("max-age=");
  });
});
