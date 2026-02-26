import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({
    getToken: vi.fn().mockResolvedValue("mock-clerk-token"),
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({ from: vi.fn() }),
}));

import { createClient } from "./server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

describe("createClient (server)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  });

  it("creates a Supabase client with correct URL and key", async () => {
    await createClient();

    expect(createSupabaseClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.objectContaining({
        accessToken: expect.any(Function),
      })
    );
  });

  it("passes an accessToken function that returns Clerk token", async () => {
    await createClient();

    const callArgs = vi.mocked(createSupabaseClient).mock.calls[0];
    const options = callArgs[2] as { accessToken: () => Promise<string> };

    const token = await options.accessToken();
    expect(token).toBe("mock-clerk-token");
  });
});
