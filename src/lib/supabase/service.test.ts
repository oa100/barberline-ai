import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

describe("createServiceClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  it("creates a client with the service role key", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const { createServiceClient } = await import("./service");

    createServiceClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-service-role-key"
    );
  });

  it("throws if service role key is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createServiceClient } = await import("./service");

    expect(() => createServiceClient()).toThrow("Missing SUPABASE_SERVICE_ROLE_KEY");
  });

  it("throws if supabase URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const { createServiceClient } = await import("./service");

    expect(() => createServiceClient()).toThrow("Missing SUPABASE_SERVICE_ROLE_KEY");
  });
});
