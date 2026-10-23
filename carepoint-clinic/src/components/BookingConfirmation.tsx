import { useEffect, useRef } from "react";
import type { Booking, Slot } from "../types/booking";
import { formatDate, formatTimeRange, timeZoneLabel } from "../utils/date";
import { TickMark } from "./Marks";
import { CareLogoMark } from "./CareLogo";

interface Props {
  booking: Booking;
  slot: Slot;
  onDone: () => void;
}

// Reads like the appointment card a front desk would hand over.
export default function BookingConfirmation({ booking, slot, onDone }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  const zone = timeZoneLabel(slot.start);
  const rows: [string, string][] = [
    ["Provider", slot.provider],
    ["Date", formatDate(slot.start)],
    ["Time", `${formatTimeRange(slot.start, slot.end)}${zone ? ` ${zone}` : ""}`],
    ["Patient", booking.name],
    ["Email", booking.email],
    ["Status", booking.status],
  ];

  return (
    <section
      className="mx-auto max-w-xl border border-ink bg-white"
      aria-labelledby="confirmed-heading"
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink bg-brand-600 px-5 py-3 text-white">
        <span className="flex items-center gap-2 font-serif text-lg font-semibold">
          <CareLogoMark size={22} className="shrink-0" />
          CarePoint Clinic
        </span>
        <span className="text-xs uppercase tracking-widest">Appointment card</span>
      </div>

      <div className="px-5 pb-2 pt-6 sm:px-8">
        <span className="flex h-10 w-10 items-center justify-center border-2 border-brand-600 text-brand-600">
          <TickMark className="h-6 w-6" />
        </span>
        <h2
          id="confirmed-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 font-serif text-3xl font-semibold leading-tight outline-none"
        >
          Appointment booked successfully
        </h2>
        <p className="mt-2 text-sm text-muted">Keep this reference for your visit.</p>

        <div className="mt-5 border-y border-dashed border-ink py-4">
          <p className="text-xs uppercase tracking-widest text-muted">Booking reference</p>
          <p className="mt-1 break-all font-serif text-2xl font-semibold tabular-nums">
            {booking.id}
          </p>
        </div>

        <dl className="divide-y divide-line text-sm">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6"
            >
              <dt className="text-muted">{label}</dt>
              <dd
                className={`break-words font-medium sm:text-right ${
                  label === "Status" ? "capitalize" : ""
                }`}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="px-5 pb-6 pt-4 sm:px-8">
        <button
          type="button"
          onClick={onDone}
          className="min-h-12 w-full cursor-pointer bg-brand-600 px-4 text-base font-medium text-white"
        >
          Back to appointments
        </button>
      </div>
    </section>
  );
}
