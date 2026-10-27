import type {
  ApiErrorInfo,
  ApiErrorKind,
  Booking,
  BookingRequest,
  Slot,
} from "../types/booking";
import { BookingSchema, SlotSchema } from "../schemas/booking";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  "https://clinic-booking-api-qidy.onrender.com"
).replace(/\/+$/, "");

const GET_TIMEOUT_MS = 30_000;
const POST_TIMEOUT_MS = 20_000;

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
  } catch { }
}

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
    "We couldn't reach the booking service. Please check your connection  .",
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
    message = `There have been too many booking attempts. Please wait ${extra.retryAfterSeconds} second${extra.retryAfterSeconds === 1 ? "" : "s"
      } before trying again.`;
  }
  return new ApiError({ kind, message, ambiguous: false, ...extra });
}


async function errorFromStatus(response: Response): Promise<ApiError> {
  const { status } = response;

  let serverMessage: string | undefined;

  try {
    const body: unknown = await response.clone().json();

    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
    ) {
      serverMessage = body.message;
    } else if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      serverMessage = body.error;
    }
  } catch {

  }

  let error: ApiError;

  switch (status) {
    case 400:
      error = buildError("bad_request", { status });
      break;
    case 401:
      error = buildError("unauthorized", { status });
      break;
    case 404:
      error = buildError("not_found", { status });
      break;
    case 409:
      error = buildError("conflict", { status });
      break;
    case 422:
      error = buildError("idempotency_mismatch", { status });
      break;
    case 429:
      error = buildError("rate_limited", {
        status,
        retryAfterSeconds: parseRetryAfter(
          response.headers.get("Retry-After"),
        ),
      });
      break;
    default:
      if (status >= 500) {
        error = buildError("server", { status, ambiguous: true });
      } else {
        error = buildError("unexpected", { status });
      }
  }

  if (serverMessage) {
    return new ApiError({
      ...error.info,
      message: serverMessage,
    });
  }

  return error;
}


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


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}



export async function fetchSlots(): Promise<Slot[]> {
  const response = await request(
    "/slots",
    { method: "GET", headers: { "x-api-key": getApiKey() } },
    GET_TIMEOUT_MS,
  );

  if (!response.ok) throw await errorFromStatus(response);

  const body: unknown = await readJson(response);

  if (!isRecord(body)) {
    throw buildError("unexpected", { status: response.status });
  }

  const result = SlotSchema.array().safeParse(body.slots);

  if (!result.success) {
    throw buildError("unexpected", { status: response.status });
  }

  return result.data;
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

  if (!response.ok) throw await errorFromStatus(response);

  const body: unknown = await readJson(response);
  const result = BookingSchema.safeParse(body);

  if (!result.success) {
    throw buildError("unexpected", {
      status: response.status,
      ambiguous: true,
    });
  }

  return result.data;
}


export function toApiErrorInfo(err: unknown): ApiErrorInfo {
  if (err instanceof ApiError) return err.info;
  return { kind: "unexpected", message: MESSAGES.unexpected, ambiguous: false };
}

export async function cancelBooking(
  bookingId: string,
  email: string,
): Promise<void> {
  const params = new URLSearchParams({
    email: email.trim().toLowerCase(),
  });

  const response = await request(
    `/bookings/${encodeURIComponent(bookingId)}?${params.toString()}`,
    {
      method: "DELETE",
      headers: {
        "x-api-key": getApiKey(),
      },
    },
    POST_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw await errorFromStatus(response);
  }
}



export async function fetchBookingsByEmail(
  email: string,
): Promise<Booking[]> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw buildError("bad_request");
  }

  const bookings: Booking[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({
      email: normalizedEmail,
      limit: "50",
    });

    if (cursor) {
      params.set("cursor", cursor);
    }

    const response = await request(
      `/bookings?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "x-api-key": getApiKey(),
        },
      },
      GET_TIMEOUT_MS,
    );

    if (!response.ok) {
      throw await errorFromStatus(response);
    }

    const body: unknown = await readJson(response);

    if (
      !isRecord(body) ||
      !Array.isArray(body.bookings) ||
      !(
        body.next_cursor === null ||
        typeof body.next_cursor === "string"
      )
    ) {
      throw buildError("unexpected", {
        status: response.status,
        ambiguous: true,
      });
    }

    bookings.push(...body.bookings);
    cursor = body.next_cursor;
  } while (cursor);

  return bookings;
}



