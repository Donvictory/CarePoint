import { useEffect, useRef, useState, type FormEvent } from "react";
import { createBooking, toApiErrorInfo } from "../services/api";
import type { ApiErrorInfo, Booking, Slot } from "../types/booking";
import { formatDate, formatTimeRange, timeZoneLabel } from "../utils/date";
import { BangMark } from "./Marks";

interface Props {
  slot: Slot;
  onBooked: (booking: Booking) => void;
  onChangeSlot: () => void;
  /** Called after errors that mean the slot list is stale or access is broken. */
  onServerError: (info: ApiErrorInfo) => void;
}

interface FieldErrors {
  name?: string;
  email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(name: string, email: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name) errors.name = "Please enter your full name.";
  if (!email) errors.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";
  return errors;
}

export default function BookingForm({ slot, onBooked, onChangeSlot, onServerError }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<ApiErrorInfo | null>(null);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // One idempotency key per logical booking attempt. It is reused for retries
  // of the exact same request, and replaced only when the request changes.
  const attempt = useRef<{ key: string; fingerprint: string } | null>(null);
  const submittingRef = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Choosing a different slot is a new booking attempt.
  useEffect(() => {
    attempt.current = null;
    setFailure(null);
    setRetryUntil(null);
  }, [slot.id]);

  // Tick for the 429 countdown.
  useEffect(() => {
    if (retryUntil === null) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= retryUntil) setRetryUntil(null);
    }, 500);
    return () => clearInterval(id);
  }, [retryUntil]);

  const waitSeconds = retryUntil ? Math.max(0, Math.ceil((retryUntil - now) / 1000)) : 0;
  const blockedByRateLimit = waitSeconds > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submittingRef.current || blockedByRateLimit) return;

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    setName(cleanName);
    setEmail(cleanEmail);

    const found = validate(cleanName, cleanEmail);
    setErrors(found);
    if (found.name) return nameRef.current?.focus();
    if (found.email) return emailRef.current?.focus();

    const payload = { slot_id: slot.id, name: cleanName, email: cleanEmail };
    const fingerprint = JSON.stringify(payload);
    if (!attempt.current || attempt.current.fingerprint !== fingerprint) {
      attempt.current = { key: crypto.randomUUID(), fingerprint };
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFailure(null);

    try {
      const booking = await createBooking(payload, attempt.current.key);
      attempt.current = null;
      onBooked(booking);
    } catch (err) {
      const info = toApiErrorInfo(err);
      setFailure(info);

      if (info.kind === "rate_limited") {
        const secs = info.retryAfterSeconds ?? 10;
        setNow(Date.now());
        setRetryUntil(Date.now() + secs * 1000);
      }
      // The key was used with a different body on the server. Start fresh next time.
      if (info.kind === "idempotency_mismatch") attempt.current = null;
      // Definitive answers about the slot: this attempt is over.
      if (info.kind === "conflict" || info.kind === "not_found") attempt.current = null;

      if (
        info.kind === "conflict" ||
        info.kind === "not_found" ||
        info.kind === "unauthorized" ||
        info.kind === "bad_request"
      ) {
        onServerError(info);
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const inputBase = "mt-1 block min-h-12 w-full bg-white px-3 text-base";
  const zone = timeZoneLabel(slot.start);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border border-ink bg-white"
      aria-labelledby="booking-heading"
    >
      <div className="border-b border-ink px-5 py-4">
        <p className="text-xs uppercase tracking-widest text-muted">Booking slip</p>
        <h2 id="booking-heading" className="font-serif text-xl font-semibold">
          Your appointment
        </h2>
      </div>

      <dl className="divide-y divide-line border-b border-ink px-5 text-sm">
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-muted">Provider</dt>
          <dd className="text-right font-medium">{slot.provider}</dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-muted">Date</dt>
          <dd className="text-right font-medium">{formatDate(slot.start)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-muted">Time</dt>
          <dd className="text-right font-medium tabular-nums">
            {formatTimeRange(slot.start, slot.end)}
            {zone && <span className="text-muted"> {zone}</span>}
          </dd>
        </div>
      </dl>

      <div className="px-5 py-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Full name
          </label>
          <input
            ref={nameRef}
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={`${inputBase} border ${errors.name ? "border-2 border-alert" : "border-ink"}`}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 flex items-center gap-2 text-sm text-alert">
              <BangMark className="h-3.5 w-3.5 shrink-0" />
              {errors.name}
            </p>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="email" className="block text-sm font-medium">
            Email address
          </label>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${inputBase} border ${errors.email ? "border-2 border-alert" : "border-ink"}`}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 flex items-center gap-2 text-sm text-alert">
              <BangMark className="h-3.5 w-3.5 shrink-0" />
              {errors.email}
            </p>
          )}
        </div>

        {failure && (
          <div role="alert" className="mt-5 border border-alert bg-alert-bg p-3 text-sm">
            <p className="flex items-start gap-2">
              <BangMark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alert" />
              <span>
                {failure.kind === "rate_limited" && blockedByRateLimit
                  ? `There have been too many booking attempts. Please wait ${waitSeconds} second${
                      waitSeconds === 1 ? "" : "s"
                    } before trying again.`
                  : failure.message}
              </span>
            </p>
            {failure.ambiguous && (
              <p className="mt-2 pl-5">
                Your booking may already have gone through. You can confirm again with the same
                details and no duplicate will be created.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="submit"
            disabled={submitting || blockedByRateLimit}
            className="min-h-12 cursor-pointer bg-brand-600 px-4 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Confirming"
              : blockedByRateLimit
                ? `Try again in ${waitSeconds}s`
                : failure?.ambiguous
                  ? "Confirm again"
                  : "Confirm booking"}
          </button>
          <button
            type="button"
            onClick={onChangeSlot}
            disabled={submitting}
            className="min-h-11 cursor-pointer px-4 text-sm font-medium underline underline-offset-4 disabled:opacity-60"
          >
            Change appointment
          </button>
        </div>
      </div>
    </form>
  );
}
