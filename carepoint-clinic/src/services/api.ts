import type {
  ApiErrorInfo,
  ApiErrorKind,
  Booking,
  BookingRequest,
  Slot,
} from "../types/booking";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  "https://clinic-booking-api-qidy.onrender.com"
).replace(/\/+$/, "");

const GET_TIMEOUT_MS = 30_000; // free-tier hosts can take a while to wake up
const POST_TIMEOUT_MS = 20_000;

/* ------------------------------------------------------------------ */
/* API key (client-side setting, entered by the user, never bundled)   */
/* ------------------------------------------------------------------ */

const API_KEY_STORAGE = "carepoint.apiKey";

export function getApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function setApiKey(value: string): void {
  try {
    const trimmed = value.trim();
    if (trimmed) localStorage.setItem(API_KEY_STORAGE, trimmed);
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    /* storage unavailable; key just won't persist */
  }
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  info: ApiErrorInfo;
  constructor(info: ApiErrorInfo) {
    super(info.message);
    this.name = "ApiError";
    this.info = info;
  }
}

const MESSAGES: Record<ApiErrorKind, string> = {
  bad_request:
    "We couldn't accept those details, or this appointment has already started. Please check your information or choose another time.",
  unauthorized:
    "The booking service couldn't verify access. Please check the API key in settings and try again.",
  not_found:
    "This appointment slot no longer exists. Please choose another time.",
  conflict:
    "That appointment was just booked by someone else. We've refreshed the list, so please choose another time.",
  idempotency_mismatch:
    "This request clashed with an earlier attempt. Please review your details and confirm again to start a fresh booking.",
  rate_limited:
    "There have been too many booking attempts. Please wait a moment before trying again.",
  server:
    "The booking service is temporarily unavailable. Please try again in a little while.",
  network:
    "We couldn't reach the booking service. Please check your connection and try again.",
  timeout:
    "The booking service took too long to respond. Please try again.",
  unexpected:
    "We received an unexpected response from the booking service. Please try again.",
};

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(header);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }
  return undefined;
}

function buildError(
  kind: ApiErrorKind,
  extra: Partial<ApiErrorInfo> & { ambiguous?: boolean } = {},
): ApiError {
  let message = MESSAGES[kind];
  if (kind === "rate_limited" && extra.retryAfterSeconds !== undefined) {
    message = `There have been too many booking attempts. Please wait ${extra.retryAfterSeconds} second${
      extra.retryAfterSeconds === 1 ? "" : "s"
    } before trying again.`;
  }
  return new ApiError({ kind, message, ambiguous: false, ...extra });
}

function errorFromStatus(response: Response): ApiError {
  const { status } = response;
  switch (status) {
    case 400:
      return buildError("bad_request", { status });
    case 401:
      return buildError("unauthorized", { status });
    case 404:
      return buildError("not_found", { status });
    case 409:
      return buildError("conflict", { status });
    case 422:
      return buildError("idempotency_mismatch", { status });
    case 429:
      return buildError("rate_limited", {
        status,
        retryAfterSeconds: parseRetryAfter(response.headers.get("Retry-After")),
      });
    default:
      if (status >= 500) {
        // The server may have processed the request before failing.
        return buildError("server", { status, ambiguous: true });
      }
      return buildError("unexpected", { status });
  }
}

/* ------------------------------------------------------------------ */
/* Core request                                                        */
/* ------------------------------------------------------------------ */

async function request(
  path: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw buildError("timeout", { ambiguous: true });
    }
    throw buildError("network", { ambiguous: true });
  } finally {
    clearTimeout(timer);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw buildError("unexpected", { status: response.status, ambiguous: true });
  }
}

/* ------------------------------------------------------------------ */
/* Shape guards                                                        */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSlot(value: unknown): value is Slot {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.provider === "string" &&
    typeof value.start === "string" &&
    typeof value.end === "string" &&
    typeof value.available === "boolean" &&
    !Number.isNaN(Date.parse(value.start)) &&
    !Number.isNaN(Date.parse(value.end))
  );
}

function isBooking(value: unknown): value is Booking {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.slot_id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.status === "string" &&
    typeof value.created_at === "string"
  );
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

export async function fetchSlots(): Promise<Slot[]> {
  const response = await request(
    "/slots",
    { method: "GET", headers: { "x-api-key": getApiKey() } },
    GET_TIMEOUT_MS,
  );
  if (!response.ok) throw errorFromStatus(response);

  const body = await readJson(response);
  if (!isRecord(body) || !Array.isArray(body.slots) || !body.slots.every(isSlot)) {
    throw buildError("unexpected", { status: response.status });
  }
  return body.slots;
}

export async function createBooking(
  payload: BookingRequest,
  idempotencyKey: string,
): Promise<Booking> {
  const response = await request(
    "/bookings",
    {
      method: "POST",
      headers: {
        "x-api-key": getApiKey(),
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    },
    POST_TIMEOUT_MS,
  );
  if (!response.ok) throw errorFromStatus(response);

  const body = await readJson(response);
  if (!isBooking(body)) {
    // The server answered success but we can't read it. A booking may exist.
    throw buildError("unexpected", { status: response.status, ambiguous: true });
  }
  return body;
}

export function toApiErrorInfo(err: unknown): ApiErrorInfo {
  if (err instanceof ApiError) return err.info;
  return { kind: "unexpected", message: MESSAGES.unexpected, ambiguous: false };
}
