export type CallOutcome =
  | "booked"
  | "no_availability"
  | "fallback"
  | "hangup"
  | "info_only";

export type BookingStatus = "confirmed" | "cancelled" | "no_show";

export interface Shop {
  id: string;
  clerk_user_id: string;
  name: string;
  phone_number: string | null;
  provider_type: string;
  provider_token: string | null;
  provider_location_id: string | null;
  vapi_agent_id: string | null;
  timezone: string;
  greeting: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  shop_id: string;
  square_member_id: string | null;
  name: string;
  active: boolean;
}

export interface CallLog {
  id: string;
  shop_id: string;
  vapi_call_id: string | null;
  caller_phone: string | null;
  duration_sec: number | null;
  outcome: CallOutcome;
  transcript: Record<string, unknown> | null;
  created_at: string;
}

export interface Booking {
  id: string;
  shop_id: string;
  call_log_id: string | null;
  provider_booking_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  team_member_id: string | null;
  service: string;
  start_time: string;
  status: BookingStatus;
  created_at: string;
}
