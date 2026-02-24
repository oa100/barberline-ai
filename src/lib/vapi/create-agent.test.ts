import { describe, it, expect, vi, beforeEach } from "vitest";
import { createVapiAgent } from "./create-agent";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubEnv("VAPI_API_KEY", "test-api-key");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
});

describe("createVapiAgent", () => {
  it("sends correct payload to Vapi API", async () => {
    const mockResponse = { id: "agent-123", name: "BarberLine - Test Shop" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await createVapiAgent({
      shopId: "shop-1",
      shopName: "Test Shop",
      greeting: "Welcome to Test Shop!",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.vapi.ai/assistant",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
      })
    );

    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.name).toBe("BarberLine - Test Shop");
    expect(body.model.model).toBe("gpt-4o-mini");
    expect(body.model.messages[0].content).toBe("Welcome to Test Shop!");
    expect(body.voice.provider).toBe("11labs");
    expect(body.serverUrl).toBe("https://example.com/api/vapi/webhook");
    expect(result).toEqual(mockResponse);
  });

  it("includes all 4 function definitions", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "agent-123" }),
    });

    await createVapiAgent({
      shopId: "shop-1",
      shopName: "Test Shop",
      greeting: "Hello!",
    });

    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );

    expect(body.functions).toHaveLength(4);

    const functionNames = body.functions.map(
      (f: { name: string }) => f.name
    );
    expect(functionNames).toContain("check_availability");
    expect(functionNames).toContain("create_booking");
    expect(functionNames).toContain("get_shop_info");
    expect(functionNames).toContain("take_message");

    expect(body.functions[0].serverUrl).toBe(
      "https://example.com/api/vapi/availability"
    );
    expect(body.functions[1].serverUrl).toBe(
      "https://example.com/api/vapi/book"
    );
    expect(body.functions[2].serverUrl).toBe(
      "https://example.com/api/vapi/info"
    );
    expect(body.functions[3].serverUrl).toBe(
      "https://example.com/api/vapi/message"
    );
  });

  it("sets shopId in metadata", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "agent-123" }),
    });

    await createVapiAgent({
      shopId: "shop-42",
      shopName: "My Barber",
      greeting: "Hi!",
    });

    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );

    expect(body.metadata).toEqual({ shopId: "shop-42" });
  });
});
