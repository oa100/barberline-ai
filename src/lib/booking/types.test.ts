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
