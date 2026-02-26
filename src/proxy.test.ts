import { describe, it, expect, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: vi.fn().mockReturnValue(() => {}),
  createRouteMatcher: vi.fn().mockReturnValue((req: { url: string }) =>
    req.url.includes("/dashboard")
  ),
}));

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { config } from "./proxy";

describe("proxy.ts", () => {
  it("uses clerkMiddleware", () => {
    expect(clerkMiddleware).toHaveBeenCalled();
  });

  it("creates route matcher for /dashboard routes", () => {
    expect(createRouteMatcher).toHaveBeenCalledWith(["/dashboard(.*)"]);
  });

  it("exports correct matcher config", () => {
    expect(config.matcher).toHaveLength(2);
    expect(config.matcher[0]).toContain("_next");
    expect(config.matcher[1]).toBe("/(api|trpc)(.*)");
  });
});
