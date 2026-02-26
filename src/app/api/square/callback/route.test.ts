import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("square", () => ({
  SquareClient: vi.fn().mockImplementation(function () {
    return {
      oAuth: {
        obtainToken: vi.fn().mockResolvedValue({
          accessToken: "sq_access_token_123",
        }),
      },
      locations: {
        list: vi.fn().mockResolvedValue({
          locations: [{ id: "loc_1" }],
        }),
      },
    };
  }),
  SquareEnvironment: { Sandbox: "sandbox", Production: "production" },
}));

vi.mock("@/lib/crypto", () => ({
  encrypt: vi.fn((text: string) => `encrypted:${text}`),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockFrom, mockUpdate, mockEq },
  };
});

vi.mock("next/headers", () => {
  const mockGet = vi.fn();
  const mockDelete = vi.fn();
  return {
    cookies: vi.fn().mockResolvedValue({
      get: mockGet,
      delete: mockDelete,
    }),
    __mocks: { mockGet, mockDelete },
  };
});

import { GET } from "./route";
import { auth } from "@clerk/nextjs/server";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks as cookieMocks } from "next/headers";

const { mockGet: mockCookieGet, mockDelete: mockCookieDelete } = cookieMocks as {
  mockGet: ReturnType<typeof vi.fn>;
  mockDelete: ReturnType<typeof vi.fn>;
};

describe("GET /api/square/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as never);
    vi.stubEnv("SQUARE_APP_ID", "sq_test_app");
    vi.stubEnv("SQUARE_APP_SECRET", "sq_test_secret");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("SQUARE_ENVIRONMENT", "sandbox");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const req = new NextRequest(
      "http://localhost/api/square/callback?code=abc&state=some-state"
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("rejects callback when state does not match cookie (CSRF protection)", async () => {
    mockCookieGet.mockReturnValue({ value: "correct-nonce" });

    const req = new NextRequest(
      "http://localhost/api/square/callback?code=abc&state=wrong-nonce"
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(location).toContain("error=csrf_mismatch");
  });

  it("rejects callback when state cookie is missing", async () => {
    mockCookieGet.mockReturnValue(undefined);

    const req = new NextRequest(
      "http://localhost/api/square/callback?code=abc&state=some-nonce"
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(location).toContain("error=csrf_mismatch");
  });

  it("accepts callback when state matches cookie", async () => {
    mockCookieGet.mockReturnValue({ value: "valid-nonce" });

    const req = new NextRequest(
      "http://localhost/api/square/callback?code=abc&state=valid-nonce"
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(location).toContain("success=true");
  });

  it("deletes the CSRF cookie after validation", async () => {
    mockCookieGet.mockReturnValue({ value: "valid-nonce" });

    const req = new NextRequest(
      "http://localhost/api/square/callback?code=abc&state=valid-nonce"
    );
    await GET(req);

    expect(mockCookieDelete).toHaveBeenCalledWith("square_oauth_state");
  });
});
