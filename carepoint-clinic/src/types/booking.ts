export interface Slot {
  id: string;
  provider: string;
  start: string;
  end: string;
  available: boolean;
}

export interface SlotsResponse {
  slots: Slot[];
}

export interface BookingRequest {
  slot_id: string;
  name: string;
  email: string;
}

export interface Booking {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export type ApiErrorKind =
  | "bad_request"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "idempotency_mismatch"
  | "rate_limited"
  | "server"
  | "network"
  | "timeout"
  | "unexpected";

export interface ApiErrorInfo {
  kind: ApiErrorKind;
  status?: number;
  message: string;
  retryAfterSeconds?: number;
  ambiguous: boolean;
}
