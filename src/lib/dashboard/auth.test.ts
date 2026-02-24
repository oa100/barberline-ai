import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockFrom, mockSelect, mockEq, mockSingle },
  };
});

import { getAuthenticatedShop } from "./auth";
import { auth } from "@clerk/nextjs/server";
import { createClient, __mocks } from "@/lib/supabase/server";

const mockAuth = vi.mocked(auth);
const { mockFrom, mockSelect, mockEq, mockSingle } = __mocks as {
  mockFrom: ReturnType<typeof vi.fn>;
  mockSelect: ReturnType<typeof vi.fn>;
  mockEq: ReturnType<typeof vi.fn>;
  mockSingle: ReturnType<typeof vi.fn>;
};

describe("getAuthenticatedShop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish mock chain after clearAllMocks
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);
  });

  it("returns null when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);

    const result = await getAuthenticatedShop();
    expect(result).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns shop when authenticated", async () => {
    const mockShop = {
      id: "shop_1",
      clerk_user_id: "user_123",
      name: "Best Barber",
      phone_number: "+15551234567",
      square_token: "sq-token",
      square_location: "LOC_1",
      vapi_agent_id: "agent_1",
      timezone: "America/New_York",
      greeting: "Welcome!",
      created_at: "2026-01-01T00:00:00Z",
    };

    mockAuth.mockResolvedValue({ userId: "user_123" } as never);
    mockSingle.mockResolvedValue({ data: mockShop });

    const result = await getAuthenticatedShop();

    expect(result).toEqual(mockShop);
    expect(mockFrom).toHaveBeenCalledWith("shops");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("clerk_user_id", "user_123");
  });
});
