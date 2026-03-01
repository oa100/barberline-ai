import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/headers", () => {
  const mockSet = vi.fn();
  return {
    cookies: vi.fn().mockResolvedValue({
      set: mockSet,
    }),
    __mocks: { mockSet },
  };
});

import { GET } from "./route";
import { auth } from "@clerk/nextjs/server";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks } from "next/headers";

const { mockSet } = __mocks as { mockSet: ReturnType<typeof vi.fn> };

function makeRequest(url = "http://localhost/api/square/oauth") {
  return new Request(url);
}

describe("GET /api/square/oauth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as never);
    vi.stubEnv("SQUARE_APP_ID", "sq_test_app");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("SQUARE_ENVIRONMENT", "sandbox");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("generates a CSRF state token and sets it as an HttpOnly cookie", async () => {
    const res = await GET(makeRequest());

    // Should redirect to Square
    expect(res.status).toBe(307);

    // Should set an HttpOnly cookie with the CSRF state
    expect(mockSet).toHaveBeenCalledWith(
      "square_oauth_state",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      })
    );

    // The state parameter in the redirect URL should match the cookie value
    const cookieState = mockSet.mock.calls[0][1];
    const redirectUrl = res.headers.get("location")!;
    const url = new URL(redirectUrl);
    expect(url.searchParams.get("state")).toBe(cookieState);
  });

  it("does NOT use userId directly as the state parameter", async () => {
    const res = await GET(makeRequest());
    const redirectUrl = res.headers.get("location")!;
    const url = new URL(redirectUrl);
    expect(url.searchParams.get("state")).not.toBe("user_123");
  });

  it("stores returnTo cookie when returnTo param is provided", async () => {
    const res = await GET(
      makeRequest("http://localhost/api/square/oauth?returnTo=/dashboard/onboarding")
    );
    expect(res.status).toBe(307);

    expect(mockSet).toHaveBeenCalledWith(
      "square_oauth_return_to",
      "/dashboard/onboarding",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      })
    );
  });
});
