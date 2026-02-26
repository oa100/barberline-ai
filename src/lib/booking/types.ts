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
