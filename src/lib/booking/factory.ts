import type { BookingProvider } from "./types";
import { SquareProvider } from "./providers/square";

interface ProviderConfig {
  provider_type: string;
  provider_token: string | null;
  provider_location_id: string | null;
}

export function getBookingProvider(config: ProviderConfig): BookingProvider {
  if (!config.provider_token || !config.provider_location_id) {
    throw new Error("No booking provider configured");
  }

  switch (config.provider_type) {
    case "square":
      return new SquareProvider(config.provider_token, config.provider_location_id);
    default:
      throw new Error(`Unsupported booking provider: ${config.provider_type}`);
  }
}
