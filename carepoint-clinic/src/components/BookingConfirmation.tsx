
import { useEffect, useRef, useState } from "react";
import type { Booking, Slot } from "../types/booking";
import { formatDate, formatTimeRange, timeZoneLabel } from "../utils/date";
import { TickMark } from "./Marks";
import { CareLogoMark } from "./CareLogo";

interface Props {
  booking: Booking;
  slot: Slot;
  onDone: () => void;
  onCancel: () => Promise<void>;
}

export default function BookingConfirmation({
  booking,
  slot,
  onDone,
  onCancel,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(
    booking.status === "cancelled",
  );
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => headingRef.current?.focus(), []);

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?",
    );

    if (!confirmed) return;

    setCancelling(true);
    setCancelError(null);

    try {
      await onCancel();
      setCancelled(true);
    } catch {
      setCancelError(
        "We couldn't cancel your appointment. Please try again.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const zone = timeZoneLabel(slot.start);

  const rows: [string, string][] = [
    ["Provider", slot.provider],
    ["Date", formatDate(slot.start)],
    [
      "Time",
      `${formatTimeRange(slot.start, slot.end)}${zone ? ` ${zone}` : ""}`,
    ],
    ["Patient", booking.name],
    ["Email", booking.email],
    ["Status", cancelled ? "cancelled" : booking.status],
  ];

  return (
    <section
      className="mx-auto max-w-xl rounded-xl border border-border-default bg-surface-raised"
      aria-labelledby="confirmed-heading"
    >
      <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-border-default bg-brand-600 px-5 py-3 text-white">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <CareLogoMark
            size={22}
            className="shrink-0"
            hasBackground={false}
          />
          CarePoint Clinic
        </span>
        <span className="text-xs font-medium uppercase tracking-widest text-white/70">
          Appointment card
        </span>
      </div>

      <div className="px-5 pb-2 pt-6 sm:px-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-bg text-success">
          <TickMark className="h-6 w-6" />
        </span>

        <h2
          id="confirmed-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 text-3xl font-bold leading-tight text-text-primary outline-none"
        >
          {cancelled ? "Appointment cancelled" : "Appointment confirmed"}
        </h2>

        <p className="mt-2 text-sm text-text-secondary">
          {cancelled
            ? "This appointment has been cancelled."
            : "Keep this reference for your visit."}
        </p>

        <div className="mt-5 border-y border-dashed border-border-default py-4">
          <p className="text-xs font-medium uppercase tracking-widest text-text-tertiary">
            Booking reference
          </p>
          <p className="mt-1 break-all text-2xl font-bold tabular-nums text-brand-400">
            {booking.id}
          </p>
        </div>

        <dl className="divide-y divide-border-subtle text-sm">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6"
            >
              <dt className="text-text-secondary">{label}</dt>
              <dd
                className={`break-words font-medium text-text-primary sm:text-right ${label === "Status" ? "capitalize" : ""
                  }`}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {cancelError && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {cancelError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 px-5 pb-6 pt-4 sm:px-8">
        {!cancelled && booking.status === "confirmed" && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="min-h-12 w-full rounded-lg border border-border-default px-4 text-base font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelling ? "Cancelling appointment..." : "Cancel appointment"}
          </button>
        )}

        <button
          type="button"
          onClick={onDone}
          disabled={cancelling}
          className="btn-primary min-h-12 w-full px-4 text-base"
        >
          Back to appointments
        </button>
      </div>
    </section>
  );
}
