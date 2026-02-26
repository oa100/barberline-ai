import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateVapiRequest, unauthorizedResponse } from "./validate";
import { NextRequest } from "next/server";

describe("validateVapiRequest", () => {
  beforeEach(() => {
    vi.stubEnv("VAPI_SERVER_SECRET", "test-secret-123");
  });

  it("returns true when secret matches", () => {
    const req = new NextRequest("http://localhost/api/vapi/webhook", {
      headers: { "x-vapi-secret": "test-secret-123" },
    });

    expect(validateVapiRequest(req)).toBe(true);
  });

  it("returns false when secret is wrong", () => {
    const req = new NextRequest("http://localhost/api/vapi/webhook", {
      headers: { "x-vapi-secret": "wrong-secret" },
    });

    expect(validateVapiRequest(req)).toBe(false);
  });

  it("returns false when no secret header", () => {
    const req = new NextRequest("http://localhost/api/vapi/webhook");
    expect(validateVapiRequest(req)).toBe(false);
  });

  it("returns false when server secret env var is not set", () => {
    vi.stubEnv("VAPI_SERVER_SECRET", "");
    const req = new NextRequest("http://localhost/api/vapi/webhook", {
      headers: { "x-vapi-secret": "any-value" },
    });

    expect(validateVapiRequest(req)).toBe(false);
  });

  it("uses timing-safe comparison (crypto.timingSafeEqual)", () => {
    const spy = vi.spyOn(
      require("crypto"),
      "timingSafeEqual"
    );

    const req = new NextRequest("http://localhost/api/vapi/webhook", {
      headers: { "x-vapi-secret": "test-secret-123" },
    });

    validateVapiRequest(req);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("handles secrets of different lengths safely", () => {
    const req = new NextRequest("http://localhost/api/vapi/webhook", {
      headers: { "x-vapi-secret": "short" },
    });

    // Should not throw - different lengths should return false
    expect(validateVapiRequest(req)).toBe(false);
  });
});

describe("unauthorizedResponse", () => {
  it("returns 401 with error message", async () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
