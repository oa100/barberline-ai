# BookingProvider Abstraction Layer Design

**Date:** February 26, 2026
**Status:** Approved

## Goal

Decouple BarberLine AI's voice agent from Square so any booking platform can be swapped in via an adapter. Ship with Square first, add Boulevard/Acuity/Booksy later without touching Vapi routes.

## Architecture

Interface + Adapter pattern. A `BookingProvider` TypeScript interface defines 4 methods. Each booking platform (Square, Boulevard, etc.) implements the interface as an adapter. A factory function reads `shop.provider_type` and returns the correct adapter. Vapi routes call the interface, never a specific platform.

One provider per shop for now. Schema designed to support multiple providers per shop later.

## BookingProvider Interface

```typescript
interface BookingProvider {
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
```

### Shared Return Types

```typescript
interface TimeSlot {
  startAt: string;              // ISO 8601
  durationMinutes: number;
  staffName?: string;
}

interface BookingResult {
  providerBookingId: string;
  startAt: string;
  serviceName: string;
  staffName?: string;
  confirmed: boolean;
}

interface ServiceInfo {
  id: string;
  name: string;
  durationMinutes: number;
  priceDisplay: string;         // "$25.00" -- pre-formatted for voice
}

interface BusinessHours {
  dayOfWeek: string;            // "MONDAY", "TUESDAY", etc.
  openTime: string;             // "09:00"
  closeTime: string;            // "17:00"
}
```

### Typed Errors

```typescript
class ProviderAuthError extends Error {}
class ProviderNotFoundError extends Error {}
class ProviderUnavailableError extends Error {}
```

## Factory

```typescript
function getBookingProvider(shop: Shop): BookingProvider {
  switch (shop.provider_type) {
    case "square":
      return new SquareProvider(shop.provider_token, shop.provider_location_id);
    case "boulevard":
      return new BoulevardProvider(shop.provider_token, shop.provider_location_id);
    default:
      throw new Error(`Unsupported provider: ${shop.provider_type}`);
  }
}
```

## Schema Migration

### `shops` table

| Current Column | New Column | Notes |
|---|---|---|
| `square_token` | `provider_token` | Stores OAuth token for any platform |
| `square_location` | `provider_location_id` | Stores location/site ID for any platform |
| *(new)* | `provider_type` | `'square' \| 'boulevard' \| 'acuity'`, defaults to `'square'` |

### `bookings` table

| Current Column | New Column | Notes |
|---|---|---|
| `square_booking_id` | `provider_booking_id` | External reference for any platform |

Backfill: All existing shops get `provider_type = 'square'`.

## File Structure

### New files

```
src/lib/booking/
  types.ts                    # BookingProvider interface + shared types + errors
  factory.ts                  # getBookingProvider() factory
  providers/
    square.ts                 # SquareProvider implements BookingProvider
```

### Modified files

- `src/app/api/vapi/availability/route.ts` -- use `provider.checkAvailability()`
- `src/app/api/vapi/book/route.ts` -- use `provider.createBooking()`
- `src/app/api/vapi/info/route.ts` -- use `provider.getServices()` + `provider.getBusinessHours()`
- `src/lib/supabase/types.ts` -- rename columns, add `provider_type`
- `src/app/api/square/callback/route.ts` -- update column names

### Deleted files (absorbed into SquareProvider)

- `src/lib/square/availability.ts`
- `src/lib/square/booking.ts`
- `src/lib/square/catalog.ts`

### Kept as-is

- `src/lib/square/client.ts` -- SquareProvider uses it internally
- `src/app/api/square/oauth/route.ts` -- Square-specific OAuth stays
- `src/app/api/vapi/message/route.ts` -- already generic (Twilio)
- `src/app/api/vapi/webhook/route.ts` -- already generic (call logging)

## Vapi Route Pattern (After)

```typescript
import { getBookingProvider } from "@/lib/booking/factory";

// validate request, get shop from Supabase
const provider = getBookingProvider(shop);
const slots = await provider.checkAvailability({ date, serviceId, staffId });

// Format for voice, return Vapi response
```

Routes own voice formatting and Vapi protocol. Providers own platform communication.

## Testing Strategy

- **Interface contract tests** -- shared suite any provider must pass
- **SquareProvider unit tests** -- mock Square SDK, verify API calls and mapping
- **Vapi route tests** -- mock the provider (not Square), verify formatting and errors
- **Integration test** -- e2e with Square sandbox

Route tests no longer depend on Square mocks. Adding a new provider requires zero route test changes.

## Platform Roadmap

1. **Square** -- shipping now (best API, zero barriers, already built)
2. **Boulevard** -- second (GraphQL API, self-serve dev portal)
3. **Acuity** -- third (requires $49/mo plan per shop)
4. **Vagaro** -- pursue when enterprise sales contact is viable
5. **Booksy** -- pursue partnership once we have traction
6. **Fresha/GlossGenius** -- no public APIs, monitor for changes
