import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock validate module - no top-level variable references
vi.mock("@/lib/vapi/validate", () => ({
  validateVapiRequest: vi.fn(),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

// Mock supabase server module - factory must not reference outer variables
vi.mock("@/lib/supabase/server", () => {
  const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockFrom, mockInsert },
  };
});

// Import after mocks
import { POST } from "./route";
import { validateVapiRequest } from "@/lib/vapi/validate";
import { createClient, __mocks } from "@/lib/supabase/server";

const mockValidate = vi.mocked(validateVapiRequest);
const { mockFrom, mockInsert } = __mocks as {
  mockFrom: ReturnType<typeof vi.fn>;
  mockInsert: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vapi/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/vapi/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidate.mockReturnValue(true);
    // Re-establish mock chain after clearAllMocks
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockResolvedValue({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);
  });

  it("returns 401 when Vapi secret is invalid", async () => {
    mockValidate.mockReturnValue(false);

    const req = makeRequest({ message: { type: "speech-update" } });
    const response = await POST(req);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns ok for non-end-of-call-report messages", async () => {
    const req = makeRequest({ message: { type: "speech-update" } });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("correctly determines 'booked' outcome from summary", async () => {
    const req = makeRequest({
      message: {
        type: "end-of-call-report",
        summary: "The customer booked an appointment for Friday.",
        assistant: { metadata: { shopId: "shop_1" } },
        call: { id: "call_1", customer: { number: "+15551234567" } },
        durationSeconds: 120,
        transcript: [{ role: "assistant", text: "Hello" }],
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    expect(mockFrom).toHaveBeenCalledWith("call_logs");
    expect(mockInsert).toHaveBeenCalledWith({
      shop_id: "shop_1",
      vapi_call_id: "call_1",
      caller_phone: "+15551234567",
      duration_sec: 120,
      outcome: "booked",
      transcript: [{ role: "assistant", text: "Hello" }],
    });
  });

  it("correctly determines 'no_availability' outcome", async () => {
    const req = makeRequest({
      message: {
        type: "end-of-call-report",
        summary: "No availability for the requested time.",
        assistant: { metadata: { shopId: "shop_2" } },
        call: { id: "call_2" },
        durationSeconds: 60,
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "no_availability" })
    );
  });

  it("inserts call_log into Supabase with all fields", async () => {
    const req = makeRequest({
      message: {
        type: "end-of-call-report",
        summary: "Customer asked about pricing.",
        assistant: { metadata: { shopId: "shop_3" } },
        call: { id: "call_3" },
        customer: { number: "+15559999999" },
        durationSeconds: 45.7,
        transcript: null,
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    expect(mockInsert).toHaveBeenCalledWith({
      shop_id: "shop_3",
      vapi_call_id: "call_3",
      caller_phone: "+15559999999",
      duration_sec: 46,
      outcome: "info_only",
      transcript: null,
    });
  });

  it("returns ok when no shopId in metadata", async () => {
    const req = makeRequest({
      message: {
        type: "end-of-call-report",
        summary: "Test call",
        assistant: { metadata: {} },
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
