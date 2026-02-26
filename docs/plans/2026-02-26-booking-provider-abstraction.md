# BookingProvider Abstraction Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Decouple the AI voice agent from Square by introducing a BookingProvider interface with adapter pattern, so any booking platform can be swapped in.

**Architecture:** A `BookingProvider` TypeScript interface defines 4 methods (`checkAvailability`, `createBooking`, `getServices`, `getBusinessHours`). Each booking platform implements the interface as an adapter. A factory reads `shop.provider_type` and returns the correct adapter. Vapi routes call the interface, never a specific platform.

**Tech Stack:** TypeScript, Next.js 16, Vitest, Supabase (PostgreSQL), Square SDK v44

---

### Task 1: Create BookingProvider Interface & Shared Types

**Files:**
- Create: `src/lib/booking/types.ts`
- Test: `src/lib/booking/types.test.ts`

**Step 1: Write the failing test**

Create `src/lib/booking/types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import type {
  BookingProvider,
  TimeSlot,
  BookingResult,
  ServiceInfo,
  BusinessHours,
} from "./types";
import {
  ProviderAuthError,
  ProviderNotFoundError,
  ProviderUnavailableError,
} from "./types";

describe("BookingProvider types", () => {
  it("TimeSlot has required shape", () => {
    const slot: TimeSlot = {
      startAt: "2026-03-01T10:00:00Z",
      durationMinutes: 30,
    };
    expect(slot.startAt).toBe("2026-03-01T10:00:00Z");
    expect(slot.durationMinutes).toBe(30);
    expect(slot.staffName).toBeUndefined();
  });

  it("BookingResult has required shape", () => {
    const result: BookingResult = {
      providerBookingId: "BK_123",
      startAt: "2026-03-01T10:00:00Z",
      serviceName: "Classic Fade",
      confirmed: true,
    };
    expect(result.providerBookingId).toBe("BK_123");
    expect(result.confirmed).toBe(true);
    expect(result.staffName).toBeUndefined();
  });

  it("ServiceInfo has required shape", () => {
    const service: ServiceInfo = {
      id: "SV_1",
      name: "Classic Fade",
      durationMinutes: 30,
      priceDisplay: "$25.00",
    };
    expect(service.priceDisplay).toBe("$25.00");
  });

  it("BusinessHours has required shape", () => {
    const hours: BusinessHours = {
      dayOfWeek: "MONDAY",
      openTime: "09:00",
      closeTime: "17:00",
    };
    expect(hours.dayOfWeek).toBe("MONDAY");
  });

  it("ProviderAuthError is an Error subclass", () => {
    const err = new ProviderAuthError("Token expired");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ProviderAuthError);
    expect(err.message).toBe("Token expired");
  });

  it("ProviderNotFoundError is an Error subclass", () => {
    const err = new ProviderNotFoundError("Service not found");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ProviderNotFoundError);
  });

  it("ProviderUnavailableError is an Error subclass", () => {
    const err = new ProviderUnavailableError("API down");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ProviderUnavailableError);
  });

  it("BookingProvider interface is structurally valid", () => {
    // This test verifies the interface compiles correctly by creating a mock
    const mockProvider: BookingProvider = {
      checkAvailability: async () => [],
      createBooking: async () => ({
        providerBookingId: "test",
        startAt: "2026-03-01T10:00:00Z",
        serviceName: "Test",
        confirmed: true,
      }),
      getServices: async () => [],
      getBusinessHours: async () => [],
    };
    expect(mockProvider.checkAvailability).toBeDefined();
    expect(mockProvider.createBooking).toBeDefined();
    expect(mockProvider.getServices).toBeDefined();
    expect(mockProvider.getBusinessHours).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/booking/types.test.ts`
Expected: FAIL — cannot find module `./types`

**Step 3: Write minimal implementation**

Create `src/lib/booking/types.ts`:

```typescript
export interface TimeSlot {
  startAt: string;
  durationMinutes: number;
  staffName?: string;
}

export interface BookingResult {
  providerBookingId: string;
  startAt: string;
  serviceName: string;
  staffName?: string;
  confirmed: boolean;
}

export interface ServiceInfo {
  id: string;
  name: string;
  durationMinutes: number;
  priceDisplay: string;
}

export interface BusinessHours {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
}

export interface BookingProvider {
  checkAvailability(params: {
    date: string;
    serviceId?: string;
    staffId?: string;
  }): Promise<TimeSlot[]>;

  createBooking(params: {
    startAt: string;
    customerName: string;
    customerPhone: string;
    serviceId?: string;
    staffId?: string;
  }): Promise<BookingResult>;

  getServices(): Promise<ServiceInfo[]>;

  getBusinessHours(): Promise<BusinessHours[]>;
}

export class ProviderAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderAuthError";
  }
}

export class ProviderNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderNotFoundError";
  }
}

export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/booking/types.test.ts`
Expected: PASS — all 8 tests green

**Step 5: Commit**

```bash
git add src/lib/booking/types.ts src/lib/booking/types.test.ts
git commit -m "feat: add BookingProvider interface and shared types"
```

---

### Task 2: Create SquareProvider Adapter

This task takes the existing logic from `src/lib/square/availability.ts`, `src/lib/square/booking.ts`, and `src/lib/square/catalog.ts` and wraps it in a class implementing `BookingProvider`.

**Files:**
- Create: `src/lib/booking/providers/square.ts`
- Test: `src/lib/booking/providers/square.test.ts`
- Reference (read-only): `src/lib/square/availability.ts`, `src/lib/square/booking.ts`, `src/lib/square/catalog.ts`, `src/lib/square/client.ts`

**Step 1: Write the failing test**

Create `src/lib/booking/providers/square.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BookingProvider } from "../types";

vi.mock("@/lib/square/client", () => ({
  createSquareClient: vi.fn(),
}));

import { createSquareClient } from "@/lib/square/client";
import { SquareProvider } from "./square";

// Helper to build a mock Square client
function makeMockSquareClient() {
  return {
    bookings: {
      searchAvailability: vi.fn().mockResolvedValue({ availabilities: [] }),
      create: vi.fn().mockResolvedValue({
        booking: {
          id: "BK_1",
          startAt: "2026-03-01T10:00:00Z",
          status: "ACCEPTED",
        },
      }),
    },
    catalog: {
      searchItems: vi.fn().mockResolvedValue({ items: [] }),
    },
    locations: {
      get: vi.fn().mockResolvedValue({
        location: { businessHours: { periods: [] } },
      }),
    },
  };
}

describe("SquareProvider", () => {
  let provider: BookingProvider;
  let mockClient: ReturnType<typeof makeMockSquareClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = makeMockSquareClient();
    vi.mocked(createSquareClient).mockReturnValue(mockClient as never);
    provider = new SquareProvider("test-token", "LOC_1");
  });

  it("implements BookingProvider interface", () => {
    expect(provider.checkAvailability).toBeDefined();
    expect(provider.createBooking).toBeDefined();
    expect(provider.getServices).toBeDefined();
    expect(provider.getBusinessHours).toBeDefined();
  });

  describe("checkAvailability", () => {
    it("returns TimeSlot[] from Square availability response", async () => {
      mockClient.bookings.searchAvailability.mockResolvedValue({
        availabilities: [
          {
            startAt: "2026-03-01T10:00:00Z",
            appointmentSegments: [
              {
                serviceVariationId: "SV_1",
                durationMinutes: 30,
                teamMemberId: "TM_1",
              },
            ],
          },
          {
            startAt: "2026-03-01T11:00:00Z",
            appointmentSegments: [
              {
                serviceVariationId: "SV_1",
                durationMinutes: 30,
              },
            ],
          },
        ],
      });

      const result = await provider.checkAvailability({ date: "2026-03-01" });

      expect(result).toEqual([
        { startAt: "2026-03-01T10:00:00Z", durationMinutes: 30, staffName: undefined },
        { startAt: "2026-03-01T11:00:00Z", durationMinutes: 30, staffName: undefined },
      ]);
    });

    it("returns empty array when no slots", async () => {
      const result = await provider.checkAvailability({ date: "2026-03-01" });
      expect(result).toEqual([]);
    });

    it("passes serviceId and staffId to Square API", async () => {
      await provider.checkAvailability({
        date: "2026-03-01",
        serviceId: "SV_1",
        staffId: "TM_1",
      });

      expect(mockClient.bookings.searchAvailability).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            filter: expect.objectContaining({
              segmentFilters: [
                expect.objectContaining({
                  serviceVariationId: "SV_1",
                  teamMemberIdFilter: { any: ["TM_1"] },
                }),
              ],
            }),
          }),
        })
      );
    });
  });

  describe("createBooking", () => {
    it("returns BookingResult from Square booking", async () => {
      mockClient.bookings.create.mockResolvedValue({
        booking: {
          id: "BK_1",
          startAt: "2026-03-01T10:00:00Z",
          status: "ACCEPTED",
        },
      });

      const result = await provider.createBooking({
        startAt: "2026-03-01T10:00:00Z",
        customerName: "John Doe",
        customerPhone: "+15551234567",
        serviceId: "SV_1",
        staffId: "TM_1",
      });

      expect(result).toEqual({
        providerBookingId: "BK_1",
        startAt: "2026-03-01T10:00:00Z",
        serviceName: "Appointment",
        staffName: undefined,
        confirmed: true,
      });
    });

    it("throws when Square returns no booking", async () => {
      mockClient.bookings.create.mockResolvedValue({ booking: undefined });

      await expect(
        provider.createBooking({
          startAt: "2026-03-01T10:00:00Z",
          customerName: "John",
          customerPhone: "+15551234567",
        })
      ).rejects.toThrow();
    });
  });

  describe("getServices", () => {
    it("returns ServiceInfo[] from Square catalog", async () => {
      mockClient.catalog.searchItems.mockResolvedValue({
        items: [
          {
            type: "ITEM",
            itemData: {
              name: "Haircut",
              variations: [
                {
                  id: "VAR_1",
                  type: "ITEM_VARIATION",
                  itemVariationData: {
                    name: "Standard",
                    serviceDuration: BigInt(1800000),
                    priceMoney: { amount: BigInt(2500), currency: "USD" },
                  },
                },
              ],
            },
          },
        ],
      });

      const result = await provider.getServices();

      expect(result).toEqual([
        {
          id: "VAR_1",
          name: "Haircut - Standard",
          durationMinutes: 30,
          priceDisplay: "$25.00",
        },
      ]);
    });

    it("returns empty array for empty catalog", async () => {
      const result = await provider.getServices();
      expect(result).toEqual([]);
    });
  });

  describe("getBusinessHours", () => {
    it("returns BusinessHours[] from Square location", async () => {
      mockClient.locations.get.mockResolvedValue({
        location: {
          businessHours: {
            periods: [
              { dayOfWeek: "MON", startLocalTime: "09:00:00", endLocalTime: "17:00:00" },
              { dayOfWeek: "TUE", startLocalTime: "09:00:00", endLocalTime: "17:00:00" },
            ],
          },
        },
      });

      const result = await provider.getBusinessHours();

      expect(result).toEqual([
        { dayOfWeek: "MON", openTime: "09:00", closeTime: "17:00" },
        { dayOfWeek: "TUE", openTime: "09:00", closeTime: "17:00" },
      ]);
    });

    it("returns empty array when no hours configured", async () => {
      mockClient.locations.get.mockResolvedValue({ location: {} });
      const result = await provider.getBusinessHours();
      expect(result).toEqual([]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/booking/providers/square.test.ts`
Expected: FAIL — cannot find module `./square`

**Step 3: Write minimal implementation**

Create `src/lib/booking/providers/square.ts`:

```typescript
import { randomUUID } from "crypto";
import { createSquareClient } from "@/lib/square/client";
import type {
  BookingProvider,
  TimeSlot,
  BookingResult,
  ServiceInfo,
  BusinessHours,
} from "../types";
import { ProviderNotFoundError } from "../types";

export class SquareProvider implements BookingProvider {
  private client;
  private locationId: string;

  constructor(accessToken: string, locationId: string) {
    this.client = createSquareClient(accessToken);
    this.locationId = locationId;
  }

  async checkAvailability(params: {
    date: string;
    serviceId?: string;
    staffId?: string;
  }): Promise<TimeSlot[]> {
    const startDate = `${params.date}T00:00:00Z`;
    const endDate = `${params.date}T23:59:59Z`;

    const response = await this.client.bookings.searchAvailability({
      query: {
        filter: {
          startAtRange: { startAt: startDate, endAt: endDate },
          locationId: this.locationId,
          segmentFilters: params.serviceId
            ? [
                {
                  serviceVariationId: params.serviceId,
                  teamMemberIdFilter: params.staffId
                    ? { any: [params.staffId] }
                    : undefined,
                },
              ]
            : undefined,
        },
      },
    });

    return (response.availabilities || []).map((a) => ({
      startAt: a.startAt!,
      durationMinutes: Number(
        a.appointmentSegments?.[0]?.durationMinutes ?? 30
      ),
      staffName: undefined,
    }));
  }

  async createBooking(params: {
    startAt: string;
    customerName: string;
    customerPhone: string;
    serviceId?: string;
    staffId?: string;
  }): Promise<BookingResult> {
    const response = await this.client.bookings.create({
      idempotencyKey: randomUUID(),
      booking: {
        locationId: this.locationId,
        startAt: params.startAt,
        appointmentSegments: [
          {
            serviceVariationId: params.serviceId || "",
            teamMemberId: params.staffId || "",
          },
        ],
        customerNote: `Booked by AI for ${params.customerName} (${params.customerPhone})`,
      },
    });

    const booking = response.booking;
    if (!booking) {
      throw new ProviderNotFoundError("Square returned no booking");
    }

    return {
      providerBookingId: booking.id || "",
      startAt: booking.startAt || params.startAt,
      serviceName: "Appointment",
      staffName: undefined,
      confirmed: true,
    };
  }

  async getServices(): Promise<ServiceInfo[]> {
    const response = await this.client.catalog.searchItems({
      enabledLocationIds: [this.locationId],
      productTypes: ["APPOINTMENTS_SERVICE"],
    });

    return (response.items || []).flatMap((item) => {
      if (item.type !== "ITEM") return [];
      const itemData = item.itemData;
      return (itemData?.variations || []).flatMap((v) => {
        if (v.type !== "ITEM_VARIATION") return [];
        const varData = v.itemVariationData;
        const priceAmount =
          Number(varData?.priceMoney?.amount || BigInt(0)) / 100;
        return [
          {
            id: v.id,
            name: `${itemData?.name} - ${varData?.name}`,
            durationMinutes: Number(
              varData?.serviceDuration
                ? varData.serviceDuration / BigInt(60000)
                : 30
            ),
            priceDisplay: `$${priceAmount.toFixed(2)}`,
          },
        ];
      });
    });
  }

  async getBusinessHours(): Promise<BusinessHours[]> {
    const response = await this.client.locations.get({
      locationId: this.locationId,
    });

    const periods = response.location?.businessHours?.periods || [];
    return periods.map((p) => ({
      dayOfWeek: p.dayOfWeek || "",
      openTime: (p.startLocalTime || "").slice(0, 5),
      closeTime: (p.endLocalTime || "").slice(0, 5),
    }));
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/booking/providers/square.test.ts`
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add src/lib/booking/providers/square.ts src/lib/booking/providers/square.test.ts
git commit -m "feat: add SquareProvider adapter implementing BookingProvider"
```

---

### Task 3: Create Provider Factory

**Files:**
- Create: `src/lib/booking/factory.ts`
- Test: `src/lib/booking/factory.test.ts`

**Step 1: Write the failing test**

Create `src/lib/booking/factory.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/square/client", () => ({
  createSquareClient: vi.fn().mockReturnValue({}),
}));

import { getBookingProvider } from "./factory";
import { SquareProvider } from "./providers/square";

describe("getBookingProvider", () => {
  it("returns SquareProvider for provider_type 'square'", () => {
    const provider = getBookingProvider({
      provider_type: "square",
      provider_token: "test-token",
      provider_location_id: "LOC_1",
    });

    expect(provider).toBeInstanceOf(SquareProvider);
  });

  it("throws for unsupported provider_type", () => {
    expect(() =>
      getBookingProvider({
        provider_type: "unknown" as never,
        provider_token: "test-token",
        provider_location_id: "LOC_1",
      })
    ).toThrow("Unsupported booking provider: unknown");
  });

  it("throws when provider_token is missing", () => {
    expect(() =>
      getBookingProvider({
        provider_type: "square",
        provider_token: null,
        provider_location_id: "LOC_1",
      })
    ).toThrow("No booking provider configured");
  });

  it("throws when provider_location_id is missing", () => {
    expect(() =>
      getBookingProvider({
        provider_type: "square",
        provider_token: "test-token",
        provider_location_id: null,
      })
    ).toThrow("No booking provider configured");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/booking/factory.test.ts`
Expected: FAIL — cannot find module `./factory`

**Step 3: Write minimal implementation**

Create `src/lib/booking/factory.ts`:

```typescript
import type { BookingProvider } from "./types";
import { SquareProvider } from "./providers/square";

type ProviderType = "square";

interface ProviderConfig {
  provider_type: ProviderType | string;
  provider_token: string | null;
  provider_location_id: string | null;
}

export function getBookingProvider(config: ProviderConfig): BookingProvider {
  if (!config.provider_token || !config.provider_location_id) {
    throw new Error("No booking provider configured");
  }

  switch (config.provider_type) {
    case "square":
      return new SquareProvider(
        config.provider_token,
        config.provider_location_id
      );
    default:
      throw new Error(
        `Unsupported booking provider: ${config.provider_type}`
      );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/booking/factory.test.ts`
Expected: PASS — all 4 tests green

**Step 5: Commit**

```bash
git add src/lib/booking/factory.ts src/lib/booking/factory.test.ts
git commit -m "feat: add booking provider factory"
```

---

### Task 4: Update Supabase Types

Rename Square-specific fields to generic provider fields in the TypeScript types. The actual database migration is a separate step (Task 8).

**Files:**
- Modify: `src/lib/supabase/types.ts`

**Step 1: Update the types**

In `src/lib/supabase/types.ts`, change the `Shop` interface:

Replace:
```typescript
  square_token: string | null;
  square_location: string | null;
```

With:
```typescript
  provider_type: string;
  provider_token: string | null;
  provider_location_id: string | null;
  // Legacy aliases — keep until all references migrated
  square_token: string | null;
  square_location: string | null;
```

In the `Booking` interface, change:

Replace:
```typescript
  square_booking_id: string | null;
```

With:
```typescript
  provider_booking_id: string | null;
  // Legacy alias
  square_booking_id: string | null;
```

> **Note:** We keep both old and new field names temporarily so nothing breaks during migration. The legacy fields will be removed in Task 7 after all references are updated.

**Step 2: Run full test suite to verify nothing breaks**

Run: `npx vitest run`
Expected: All 119 tests PASS (no changes to logic, only type additions)

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add provider_type and provider_location_id to types"
```

---

### Task 5: Refactor Vapi Availability Route

Replace direct Square calls with the BookingProvider interface.

**Files:**
- Modify: `src/app/api/vapi/availability/route.ts`
- Modify: `src/app/api/vapi/availability/route.test.ts`

**Step 1: Update the test to mock the provider factory instead of Square**

Rewrite `src/app/api/vapi/availability/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/vapi/validate", () => ({
  validateVapiRequest: vi.fn(),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockSingle },
  };
});

const mockProvider = {
  checkAvailability: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn(),
  getServices: vi.fn(),
  getBusinessHours: vi.fn(),
};

vi.mock("@/lib/booking/factory", () => ({
  getBookingProvider: vi.fn().mockReturnValue(mockProvider),
}));

import { POST } from "./route";
import { validateVapiRequest } from "@/lib/vapi/validate";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks } from "@/lib/supabase/server";

const { mockSingle } = __mocks as { mockSingle: ReturnType<typeof vi.fn> };

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vapi/availability", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeBody(params: Record<string, unknown> = {}, shopId = "shop_1") {
  return {
    message: {
      functionCall: { parameters: { date: "2026-03-01", ...params } },
      assistant: { metadata: { shopId } },
    },
  };
}

describe("POST /api/vapi/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateVapiRequest).mockReturnValue(true);
    mockSingle.mockResolvedValue({
      data: {
        provider_type: "square",
        provider_token: "tok",
        provider_location_id: "LOC_1",
        timezone: "America/New_York",
      },
      error: null,
    });
  });

  it("returns 401 when Vapi request is invalid", async () => {
    vi.mocked(validateVapiRequest).mockReturnValue(false);
    const res = await POST(makeRequest(makeBody()));
    expect(res.status).toBe(401);
  });

  it("returns 403 when shopId mismatches metadata", async () => {
    const body = {
      message: {
        functionCall: { parameters: { shopId: "attacker", date: "2026-03-01" } },
        assistant: { metadata: { shopId: "real-shop" } },
      },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(403);
  });

  it("returns 400 when date is missing", async () => {
    const body = {
      message: {
        functionCall: { parameters: {} },
        assistant: { metadata: { shopId: "shop_1" } },
      },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
  });

  it("calls provider.checkAvailability with correct params", async () => {
    mockProvider.checkAvailability.mockResolvedValue([
      { startAt: "2026-03-01T10:00:00Z", durationMinutes: 30 },
    ]);

    await POST(makeRequest(makeBody({ serviceId: "SV_1", staffId: "TM_1" })));

    expect(mockProvider.checkAvailability).toHaveBeenCalledWith({
      date: "2026-03-01",
      serviceId: "SV_1",
      staffId: "TM_1",
    });
  });

  it("returns formatted time slots in voice response", async () => {
    mockProvider.checkAvailability.mockResolvedValue([
      { startAt: "2026-03-01T15:00:00Z", durationMinutes: 30 },
      { startAt: "2026-03-01T16:00:00Z", durationMinutes: 30 },
    ]);

    const res = await POST(makeRequest(makeBody()));
    const body = await res.json();

    expect(body.results[0].result).toContain("Available times");
    expect(body.results[0].availableSlots).toHaveLength(2);
  });

  it("returns no-availability message when empty", async () => {
    const res = await POST(makeRequest(makeBody()));
    const body = await res.json();

    expect(body.results[0].result).toContain("no available time slots");
  });

  it("handles shop not found gracefully", async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    const res = await POST(makeRequest(makeBody()));
    const body = await res.json();

    expect(body.results[0].result).toContain("couldn't find");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/vapi/availability/route.test.ts`
Expected: FAIL — route still imports from `@/lib/square/*`

**Step 3: Rewrite the route**

Replace `src/app/api/vapi/availability/route.ts` entirely:

```typescript
import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { createClient } from "@/lib/supabase/server";
import { extractShopId } from "@/lib/vapi/extract-shop-id";
import { getBookingProvider } from "@/lib/booking/factory";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const params = body.message?.functionCall?.parameters ?? {};

    const { shopId, mismatch } = extractShopId(body);
    if (mismatch) {
      return Response.json(
        { results: [{ result: "There was a shopId mismatch. Please try again." }] },
        { status: 403 }
      );
    }

    const { date, serviceId, staffId } = params;

    if (!shopId || !date) {
      return Response.json(
        { results: [{ result: "I need the shop ID and a date to check availability. Could you provide those?" }] },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("provider_type, provider_token, provider_location_id, timezone")
      .eq("id", shopId)
      .single();

    if (error || !shop?.provider_token || !shop?.provider_location_id) {
      return Response.json({
        results: [{ result: "I'm sorry, I couldn't find the shop information. Please try again later." }],
      });
    }

    const provider = getBookingProvider(shop);
    const slots = await provider.checkAvailability({ date, serviceId, staffId });

    if (slots.length === 0) {
      return Response.json({
        results: [{ result: `There are no available time slots on ${date}. Would you like to check another date?`, availableSlots: [] }],
      });
    }

    const topSlots = slots.slice(0, 3);
    const formattedTimes = topSlots
      .map((slot) => {
        const dt = new Date(slot.startAt);
        return dt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: shop.timezone || "America/New_York",
        });
      })
      .join(", ");

    return Response.json({
      results: [{ result: `Available times on ${date}: ${formattedTimes}. Which time works best for you?`, availableSlots: topSlots }],
    });
  } catch (err) {
    console.error("Availability check failed:", err);
    return Response.json(
      { results: [{ result: "I'm sorry, I had trouble checking availability. Please try again." }] },
      { status: 500 }
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/vapi/availability/route.test.ts`
Expected: PASS — all 7 tests green

**Step 5: Commit**

```bash
git add src/app/api/vapi/availability/route.ts src/app/api/vapi/availability/route.test.ts
git commit -m "refactor: availability route uses BookingProvider instead of Square directly"
```

---

### Task 6: Refactor Vapi Book Route

**Files:**
- Modify: `src/app/api/vapi/book/route.ts`
- Create: `src/app/api/vapi/book/route.test.ts`

**Step 1: Write the test**

Create `src/app/api/vapi/book/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/vapi/validate", () => ({
  validateVapiRequest: vi.fn(),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === "bookings") return { insert: mockInsert };
    return { select: mockSelect };
  });
  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockSingle, mockInsert },
  };
});

const mockProvider = {
  checkAvailability: vi.fn(),
  createBooking: vi.fn(),
  getServices: vi.fn(),
  getBusinessHours: vi.fn(),
};

vi.mock("@/lib/booking/factory", () => ({
  getBookingProvider: vi.fn().mockReturnValue(mockProvider),
}));

vi.mock("@/lib/twilio/send-sms", () => ({
  sendSms: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { validateVapiRequest } from "@/lib/vapi/validate";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks } from "@/lib/supabase/server";

const { mockSingle, mockInsert } = __mocks as {
  mockSingle: ReturnType<typeof vi.fn>;
  mockInsert: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vapi/book", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeBody(params: Record<string, unknown> = {}) {
  return {
    message: {
      functionCall: {
        parameters: {
          startAt: "2026-03-01T10:00:00Z",
          customerName: "John Doe",
          customerPhone: "+15551234567",
          serviceId: "SV_1",
          serviceName: "Classic Fade",
          ...params,
        },
      },
      assistant: { metadata: { shopId: "shop_1" } },
    },
  };
}

describe("POST /api/vapi/book", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateVapiRequest).mockReturnValue(true);
    mockSingle.mockResolvedValue({
      data: {
        provider_type: "square",
        provider_token: "tok",
        provider_location_id: "LOC_1",
        phone_number: "+15559999999",
        name: "Fresh Cuts",
      },
      error: null,
    });
    mockProvider.createBooking.mockResolvedValue({
      providerBookingId: "BK_1",
      startAt: "2026-03-01T10:00:00Z",
      serviceName: "Classic Fade",
      confirmed: true,
    });
  });

  it("calls provider.createBooking with correct params", async () => {
    await POST(makeRequest(makeBody()));

    expect(mockProvider.createBooking).toHaveBeenCalledWith({
      startAt: "2026-03-01T10:00:00Z",
      customerName: "John Doe",
      customerPhone: "+15551234567",
      serviceId: "SV_1",
      staffId: undefined,
    });
  });

  it("saves booking to Supabase with provider_booking_id", async () => {
    await POST(makeRequest(makeBody()));

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        shop_id: "shop_1",
        provider_booking_id: "BK_1",
        customer_name: "John Doe",
        status: "confirmed",
      })
    );
  });

  it("returns confirmation message on success", async () => {
    const res = await POST(makeRequest(makeBody()));
    const body = await res.json();

    expect(body.results[0].result).toContain("confirmed");
    expect(body.results[0].bookingId).toBe("BK_1");
  });

  it("returns 400 when required params missing", async () => {
    const body = {
      message: {
        functionCall: { parameters: { startAt: "2026-03-01T10:00:00Z" } },
        assistant: { metadata: { shopId: "shop_1" } },
      },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
  });

  it("handles provider failure gracefully", async () => {
    mockProvider.createBooking.mockRejectedValue(new Error("API down"));
    const res = await POST(makeRequest(makeBody()));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.results[0].result).toContain("trouble");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/vapi/book/route.test.ts`
Expected: FAIL — route still imports Square directly

**Step 3: Rewrite the route**

Replace `src/app/api/vapi/book/route.ts` entirely:

```typescript
import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/twilio/send-sms";
import { extractShopId } from "@/lib/vapi/extract-shop-id";
import { getBookingProvider } from "@/lib/booking/factory";

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const params = body.message?.functionCall?.parameters ?? {};

    const { shopId, mismatch } = extractShopId(body);
    if (mismatch) {
      return Response.json(
        { results: [{ result: "There was a shopId mismatch. Please try again." }] },
        { status: 403 }
      );
    }

    const { startAt, customerName, customerPhone, serviceId, staffId, serviceName } = params;

    if (!shopId || !startAt || !customerName) {
      return Response.json(
        { results: [{ result: "I need your name, the time slot, and the service to complete the booking." }] },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("provider_type, provider_token, provider_location_id, phone_number, name")
      .eq("id", shopId)
      .single();

    if (error || !shop?.provider_token || !shop?.provider_location_id) {
      return Response.json({
        results: [{ result: "I'm sorry, I couldn't find the shop information. Please try again later." }],
      });
    }

    const provider = getBookingProvider(shop);
    const booking = await provider.createBooking({
      startAt,
      customerName,
      customerPhone: customerPhone || "",
      serviceId,
      staffId,
    });

    // Save booking record to Supabase
    await supabase.from("bookings").insert({
      shop_id: shopId,
      provider_booking_id: booking.providerBookingId,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      service: serviceName || booking.serviceName,
      start_time: startAt,
      status: "confirmed",
    });

    // Send SMS confirmation to the barber
    if (shop.phone_number) {
      try {
        const appointmentTime = new Date(startAt);
        await sendSms({
          to: shop.phone_number,
          body: `New booking: ${customerName} at ${appointmentTime.toLocaleString("en-US", { timeZone: "America/New_York" })} for ${serviceName || "an appointment"}. Booked via BarberLine AI.`,
        });
      } catch (smsErr) {
        console.error("SMS notification failed:", smsErr);
      }
    }

    const formattedTime = new Date(startAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    });

    return Response.json({
      results: [{
        result: `Your appointment is confirmed for ${formattedTime}. ${customerName}, you're all set! Is there anything else I can help with?`,
        bookingId: booking.providerBookingId,
      }],
    });
  } catch (err) {
    console.error("Booking creation failed:", err);
    return Response.json(
      { results: [{ result: "I'm sorry, I had trouble creating the booking. Please try again." }] },
      { status: 500 }
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/vapi/book/route.test.ts`
Expected: PASS — all 5 tests green

**Step 5: Commit**

```bash
git add src/app/api/vapi/book/route.ts src/app/api/vapi/book/route.test.ts
git commit -m "refactor: book route uses BookingProvider instead of Square directly"
```

---

### Task 7: Refactor Vapi Info Route

**Files:**
- Modify: `src/app/api/vapi/info/route.ts`
- Create: `src/app/api/vapi/info/route.test.ts`

**Step 1: Write the test**

Create `src/app/api/vapi/info/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/vapi/validate", () => ({
  validateVapiRequest: vi.fn(),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  return {
    createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
    __mocks: { mockSingle },
  };
});

const mockProvider = {
  checkAvailability: vi.fn(),
  createBooking: vi.fn(),
  getServices: vi.fn().mockResolvedValue([]),
  getBusinessHours: vi.fn().mockResolvedValue([]),
};

vi.mock("@/lib/booking/factory", () => ({
  getBookingProvider: vi.fn().mockReturnValue(mockProvider),
}));

import { POST } from "./route";
import { validateVapiRequest } from "@/lib/vapi/validate";
// @ts-expect-error __mocks injected by vi.mock
import { __mocks } from "@/lib/supabase/server";

const { mockSingle } = __mocks as { mockSingle: ReturnType<typeof vi.fn> };

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vapi/info", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeBody() {
  return {
    message: {
      functionCall: { parameters: {} },
      assistant: { metadata: { shopId: "shop_1" } },
    },
  };
}

describe("POST /api/vapi/info", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateVapiRequest).mockReturnValue(true);
    mockSingle.mockResolvedValue({
      data: {
        provider_type: "square",
        provider_token: "tok",
        provider_location_id: "LOC_1",
        name: "Fresh Cuts",
      },
      error: null,
    });
  });

  it("calls provider.getServices and provider.getBusinessHours", async () => {
    await POST(makeRequest(makeBody()));

    expect(mockProvider.getServices).toHaveBeenCalled();
    expect(mockProvider.getBusinessHours).toHaveBeenCalled();
  });

  it("formats services in voice response", async () => {
    mockProvider.getServices.mockResolvedValue([
      { id: "SV_1", name: "Classic Fade", durationMinutes: 30, priceDisplay: "$25.00" },
    ]);

    const res = await POST(makeRequest(makeBody()));
    const body = await res.json();

    expect(body.results[0].result).toContain("Classic Fade");
    expect(body.results[0].result).toContain("$25.00");
    expect(body.results[0].result).toContain("30 min");
  });

  it("formats business hours in voice response", async () => {
    mockProvider.getBusinessHours.mockResolvedValue([
      { dayOfWeek: "MON", openTime: "09:00", closeTime: "17:00" },
    ]);

    const res = await POST(makeRequest(makeBody()));
    const body = await res.json();

    expect(body.results[0].result).toContain("Monday");
    expect(body.results[0].result).toContain("9:00 AM");
    expect(body.results[0].result).toContain("5:00 PM");
  });

  it("handles empty services and hours", async () => {
    const res = await POST(makeRequest(makeBody()));
    const body = await res.json();

    expect(body.results[0].result).toContain("No services listed");
    expect(body.results[0].result).toContain("Hours not available");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/vapi/info/route.test.ts`
Expected: FAIL — route still imports Square directly

**Step 3: Rewrite the route**

Replace `src/app/api/vapi/info/route.ts` entirely:

```typescript
import { NextRequest } from "next/server";
import {
  validateVapiRequest,
  unauthorizedResponse,
} from "@/lib/vapi/validate";
import { createClient } from "@/lib/supabase/server";
import { extractShopId } from "@/lib/vapi/extract-shop-id";
import { getBookingProvider } from "@/lib/booking/factory";

const DAY_NAMES: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

function formatTime(time: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${minutes} ${suffix}`;
}

export async function POST(req: NextRequest) {
  if (!validateVapiRequest(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();

    const { shopId, mismatch } = extractShopId(body);
    if (mismatch) {
      return Response.json(
        { results: [{ result: "There was a shopId mismatch. Please try again." }] },
        { status: 403 }
      );
    }

    if (!shopId) {
      return Response.json(
        { results: [{ result: "I need the shop ID to look up information." }] },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: shop, error } = await supabase
      .from("shops")
      .select("provider_type, provider_token, provider_location_id, name")
      .eq("id", shopId)
      .single();

    if (error || !shop?.provider_token || !shop?.provider_location_id) {
      return Response.json({
        results: [{ result: "I'm sorry, I couldn't find the shop information right now." }],
      });
    }

    const provider = getBookingProvider(shop);
    const [services, hours] = await Promise.all([
      provider.getServices(),
      provider.getBusinessHours(),
    ]);

    const servicesText =
      services.length > 0
        ? services
            .map((s) => `${s.name} - ${s.priceDisplay} (${s.durationMinutes} min)`)
            .join("; ")
        : "No services listed";

    const hoursText =
      hours.length > 0
        ? hours
            .map((h) => {
              const day = DAY_NAMES[h.dayOfWeek] || h.dayOfWeek;
              return `${day}: ${formatTime(h.openTime)} - ${formatTime(h.closeTime)}`;
            })
            .join("; ")
        : "Hours not available";

    return Response.json({
      results: [{
        result: `Here's the info for ${shop.name || "the shop"}. Services offered: ${servicesText}. Business hours: ${hoursText}.`,
        services,
        businessHours: hours,
      }],
    });
  } catch (err) {
    console.error("Shop info lookup failed:", err);
    return Response.json(
      { results: [{ result: "I'm sorry, I had trouble getting shop information. Please try again." }] },
      { status: 500 }
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/vapi/info/route.test.ts`
Expected: PASS — all 4 tests green

**Step 5: Commit**

```bash
git add src/app/api/vapi/info/route.ts src/app/api/vapi/info/route.test.ts
git commit -m "refactor: info route uses BookingProvider instead of Square directly"
```

---

### Task 8: Update Square OAuth Callback to Use Generic Column Names

**Files:**
- Modify: `src/app/api/square/callback/route.ts`
- Modify: `src/app/api/square/callback/route.test.ts`

**Step 1: Update the callback route**

In `src/app/api/square/callback/route.ts`, change the Supabase update from:

```typescript
      .update({
        square_token: accessToken,
        square_location: locationId,
      })
```

To:

```typescript
      .update({
        provider_type: "square",
        provider_token: accessToken,
        provider_location_id: locationId,
      })
```

**Step 2: Update the test**

In `src/app/api/square/callback/route.test.ts`, update any assertions that check for `square_token` or `square_location` to check for `provider_token` and `provider_location_id` instead.

**Step 3: Run tests**

Run: `npx vitest run src/app/api/square/callback/route.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/api/square/callback/route.ts src/app/api/square/callback/route.test.ts
git commit -m "refactor: Square OAuth callback writes to generic provider columns"
```

---

### Task 9: Remove Legacy Square Aliases from Types & Clean Up

Once all routes use the new provider fields, remove the legacy `square_*` fields from the TypeScript types and delete the old standalone Square helper files (their logic now lives in `SquareProvider`).

**Files:**
- Modify: `src/lib/supabase/types.ts` — remove `square_token`, `square_location`, `square_booking_id`
- Delete: `src/lib/square/availability.ts`
- Delete: `src/lib/square/booking.ts`
- Delete: `src/lib/square/catalog.ts`
- Delete: `src/lib/square/availability.test.ts`
- Delete: `src/lib/square/booking.test.ts`
- Delete: `src/lib/square/catalog.test.ts`
- Keep: `src/lib/square/client.ts` (still used by SquareProvider)

**Step 1: Remove legacy fields from types**

In `src/lib/supabase/types.ts`, remove:
```typescript
  // Legacy aliases — keep until all references migrated
  square_token: string | null;
  square_location: string | null;
```
and:
```typescript
  // Legacy alias
  square_booking_id: string | null;
```

**Step 2: Search for any remaining references to old fields**

Run: `grep -r "square_token\|square_location\|square_booking_id" src/ --include="*.ts" --include="*.tsx"`

If any remain, update them to use the new names. The `src/lib/square/client.ts` file should NOT reference these (it takes a token parameter).

**Step 3: Delete old Square helper files**

```bash
rm src/lib/square/availability.ts src/lib/square/booking.ts src/lib/square/catalog.ts
rm src/lib/square/availability.test.ts src/lib/square/booking.test.ts src/lib/square/catalog.test.ts
```

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS. Test count will decrease slightly (old Square helper tests removed, replaced by SquareProvider tests).

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove legacy square_* fields and standalone Square helper files"
```

---

### Task 10: Database Migration

Create a Supabase migration to rename columns and add `provider_type`.

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_add_provider_columns.sql`

**Step 1: Write the migration SQL**

```sql
-- Add provider_type column with default for existing shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS provider_type text NOT NULL DEFAULT 'square';

-- Rename square-specific columns to generic provider columns
ALTER TABLE shops RENAME COLUMN square_token TO provider_token;
ALTER TABLE shops RENAME COLUMN square_location TO provider_location_id;

-- Rename in bookings table
ALTER TABLE bookings RENAME COLUMN square_booking_id TO provider_booking_id;

-- Update RLS policies if they reference old column names
-- (Check existing policies first — they likely reference column names)
```

> **Important:** Before running this migration, verify that your Supabase RLS policies don't reference the old column names. If they do, update the policies in the same migration.

**Step 2: Test locally**

If you have Supabase CLI configured:
```bash
npx supabase db push
```

Or apply via the Supabase dashboard SQL editor in development.

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add database migration for provider abstraction columns"
```

---

### Task 11: Run Full Test Suite & Verify

**Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass. The total count should be approximately:
- Previous: 119 tests across 30 files
- Removed: ~10 tests (old Square helper tests)
- Added: ~30 tests (types, SquareProvider, factory, route tests)
- Expected total: ~139 tests across ~30 files

**Step 2: Verify no Square imports remain in Vapi routes**

```bash
grep -r "from.*@/lib/square" src/app/api/vapi/ --include="*.ts"
```

Expected: No output (all Square references removed from Vapi routes)

**Step 3: Verify Square imports only exist where expected**

```bash
grep -r "from.*@/lib/square" src/ --include="*.ts"
```

Expected: Only in:
- `src/lib/booking/providers/square.ts` (the adapter)
- `src/app/api/square/oauth/route.ts` (Square-specific OAuth)
- `src/app/api/square/callback/route.ts` (Square-specific OAuth)

**Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup after booking provider abstraction"
```
