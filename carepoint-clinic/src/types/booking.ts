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
  | "bad_request" // 400
  | "unauthorized" // 401
  | "not_found" // 404
  | "conflict" // 409
  | "idempotency_mismatch" // 422
  | "rate_limited" // 429
  | "server" // 500 / 502 / 503 / 504
  | "network" // fetch failed
  | "timeout" // aborted by our timeout
  | "unexpected"; // bad shape or unhandled status

export interface ApiErrorInfo {
  kind: ApiErrorKind;
  status?: number;
  /** Patient-friendly text. Never contains backend internals. */
  message: string;
  /** Seconds, from the Retry-After header on a 429. */
  retryAfterSeconds?: number;
  /**
   * True when the request may have reached the server even though we got no
   * usable response (network failure, timeout, 5xx, bad body). A booking
   * could exist in this state, so retries must reuse the same idempotency key.
   */
  ambiguous: boolean;
}
