import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header, { type ServiceStatus } from "./components/Header";
import SlotCard from "./components/SlotCard";
import BookingForm from "./components/BookingForm";
import BookingConfirmation from "./components/BookingConfirmation";
import LoadingState from "./components/LoadingState";
import ErrorState from "./components/ErrorState";
import ApiKeyModal from "./components/ApiKeyPanel";
import ManageBooking from "./components/ManageBooking";
import {
  fetchSlots,
  getApiKey,
  toApiErrorInfo,
  cancelBooking,
} from "./services/api";
import type { ApiErrorInfo, Booking, Slot } from "./types/booking";
import { dayKey, formatDayHeading, timeZoneLabel } from "./utils/date";

interface Confirmed {
  booking: Booking;
  slot: Slot;
}

interface DayGroup {
  key: string;
  heading: string;
  slots: Slot[];
}

function groupByDay(slots: Slot[]): DayGroup[] {
  const sorted = [...slots].sort(
    (a, b) => Date.parse(a.start) - Date.parse(b.start),
  );

  const groups: DayGroup[] = [];

  for (const slot of sorted) {
    const key = dayKey(slot.start);
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.slots.push(slot);
    } else {
      groups.push({
        key,
        heading: formatDayHeading(slot.start),
        slots: [slot],
      });
    }
  }

  return groups;
}

// B7: IntersectionObserver for scroll reveals
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      el.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useReveal();

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

export default function App() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiErrorInfo | null>(null);
  const [status, setStatus] = useState<ServiceStatus>("checking");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showManageBooking, setShowManageBooking] = useState(false);

  const requestId = useRef(0);
  useEffect(() => {
    if (!getApiKey()) {
      setShowApiKeyModal(true);
    }
  }, []);

  const loadSlots = useCallback(async () => {
    const id = ++requestId.current;

    setLoading(true);
    setLoadError(null);

    try {
      const data = await fetchSlots();

      if (id !== requestId.current) return;

      setSlots(data);
      setStatus("connected");

      setSelectedId((current) => {
        if (
          current &&
          !data.some((slot) => slot.id === current && slot.available)
        ) {
          setNotice(
            "The appointment you selected is no longer available. Please choose another.",
          );
          return null;
        }

        return current;
      });
    } catch (err) {
      if (id !== requestId.current) return;

      const info = toApiErrorInfo(err);

      setLoadError(info);
      setStatus(
        info.kind === "unauthorized"
          ? "unauthorized"
          : info.kind === "network" ||
            info.kind === "timeout" ||
            info.kind === "server"
            ? "unreachable"
            : "connected",
      );
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const selectedSlot =
    slots?.find((slot) => slot.id === selectedId) ?? null;

  const groups = useMemo(
    () => (slots ? groupByDay(slots) : []),
    [slots],
  );


  function handleSelect(slot: Slot) {
    if (!slot.available) return;

    setNotice(null);
    setSelectedId(slot.id);
    setShowBookingModal(true);
  }


  function handleBooked(booking: Booking) {
    if (!selectedSlot) return;
    setShowBookingModal(false);

    setConfirmed({
      booking,
      slot: selectedSlot,
    });

    setSelectedId(null);
    setNotice(null);

    void loadSlots();
  }

  function handleServerError(info: ApiErrorInfo) {
    if (info.kind === "conflict" || info.kind === "not_found") {
      setSelectedId(null);
      setNotice(info.message);
      void loadSlots();
    }

    if (info.kind === "unauthorized") {
      setStatus("unauthorized");
      setShowApiKeyModal(true);
    }
  }

  async function handleCancelBooking() {
    if (!confirmed) return;
    const bookingId = confirmed.booking.id;
    await cancelBooking(bookingId, confirmed.booking.email);
    setConfirmed((current) =>
      current
        ? {
          ...current,
          booking: {
            ...current.booking,
            status: "cancelled",
          },
        }
        : null,
    );
    await loadSlots();
  }

  const availableCount =
    slots?.filter((slot) => slot.available).length ?? 0;

  const showSkeleton = loading && slots === null;

  const zone =
    slots && slots.length > 0
      ? timeZoneLabel(slots[0].start)
      : "";

  return (
    <div className="min-h-screen bg-surface-base lg:bg-primary-900">
      <Header status={status} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {confirmed ? (
          <RevealSection>
            <BookingConfirmation
              booking={confirmed.booking}
              slot={confirmed.slot}
              onDone={() => setConfirmed(null)}
              onCancel={handleCancelBooking}
            />
          </RevealSection>
        ) : showManageBooking ? (
          <RevealSection>
            <ManageBooking
              onClose={() => setShowManageBooking(false)}
              onBookingUpdated={() => void loadSlots()}
            />
          </RevealSection>
        ) : (
          <>
            <RevealSection>
              <div className="mx-auto max-w-2xl text-center">


                <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                  <span className="bg-gradient-to-r from-[#1A1A1A] to-[#5C5C5C] bg-clip-text text-transparent">
                    Book your clinic
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-[#1A1A1A] to-[#5C5C5C] bg-clip-text text-transparent">
                    appointment
                  </span>
                </h1>

                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
                  CarePoint helps you find real-time appointment openings with our
                  healthcare providers and confirm your visit in seconds—making
                  clinic scheduling simple, reliable, and convenient.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 border-y border-border-subtle py-3 text-xs font-medium text-text-secondary sm:text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 shrink-0 text-brand-500"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 5.5h11M5 2.5v3M11 2.5v3M3 3.5h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1v-8a1 1 0 011-1z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 9.5l1.5 1.5 3-3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Simple booking
                  </span>

                  <span
                    className="hidden h-3 w-px bg-border-default sm:inline-block"
                    aria-hidden="true"
                  />

                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 shrink-0 text-brand-500"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      aria-hidden="true"
                    >
                      <circle cx="8" cy="8" r="5.5" strokeLinecap="round" />
                      <path
                        d="M8 5v3.25l2.25 1.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Convenient time slots
                  </span>

                  <span
                    className="hidden h-3 w-px bg-border-default sm:inline-block"
                    aria-hidden="true"
                  />

                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 shrink-0 text-brand-500"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      aria-hidden="true"
                    >
                      <rect x="2.5" y="3.5" width="11" height="9.5" rx="1.5" />
                      <path d="M5.5 6.75h5M5.5 9.25h3" strokeLinecap="round" />
                    </svg>
                    Easy booking management
                  </span>
                </div>

                <div className="mt-5">
                  <a
                    href="#slots-heading"
                    className="group inline-flex items-center gap-1.5 text-xs font-medium text-text-tertiary transition-colors hover:text-text-primary focus:outline-none"
                  >
                    <span>Explore available appointment slots below</span>
                    <svg
                      className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-y-0.5"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 6.25L8 10.75L12.5 6.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </RevealSection>

            <RevealSection className="mt-10">
              <div className="mx-auto w-full max-w-3xl">
                <section aria-labelledby="slots-heading">
                  <div className="flex items-end justify-between gap-3 border-b border-border-default pb-3">
                    <div>
                      <h2
                        id="slots-heading"
                        className="text-2xl font-semibold text-text-primary"
                      >
                        Available appointments
                      </h2>

                      {slots && slots.length > 0 && (
                        <p className="mt-1 text-sm text-text-secondary">
                          {availableCount} open
                          {zone ? `, times shown in ${zone}` : ""}
                        </p>
                      )}
                    </div>
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setNotice(null);
                          setShowManageBooking(true);
                        }}
                        className="cursor-pointer text-text-secondary transition-colors btn-secondary min-h-11 px-4 text-sm"
                      >
                        Manage Bookings
                      </button>
                    </>
                  </div>

                  {notice && (
                    <p
                      role="status"
                      className="mt-4 rounded-lg border border-notice-border bg-notice-bg p-3 text-sm text-text-primary"
                    >
                      {notice}
                    </p>
                  )}

                  <div className="mt-6">
                    {showSkeleton ? (
                      <LoadingState />
                    ) : loadError && slots === null ? (
                      <ErrorState
                        title="Could not load appointments"
                        message={loadError.message}
                        onRetry={() => void loadSlots()}
                        action={
                          loadError.kind === "unauthorized"
                            ? {
                              label: "Enter access key",
                              onClick: () => setShowApiKeyModal(true),
                            }
                            : undefined
                        }
                      />
                    ) : slots && slots.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border-default p-8">
                        <h3 className="text-xl font-semibold text-text-primary">
                          No appointments available right now
                        </h3>

                        <p className="mt-1 text-sm text-text-secondary">
                          New times are added regularly. Please check back
                          soon.
                        </p>
                      </div>
                    ) : (
                      slots && (
                        <>
                          {loadError && (
                            <div className="mb-6">
                              <ErrorState
                                title="Could not refresh availability"
                                message={`${loadError.message} The list below may be out of date.`}
                                onRetry={() => void loadSlots()}
                              />
                            </div>
                          )}

                          {availableCount === 0 && (
                            <p className="mb-6 text-sm text-text-secondary">
                              All appointments are currently booked. Please
                              check back soon.
                            </p>
                          )}

                          <div
                            aria-busy={loading}
                            className="space-y-8"
                          >
                            {groups.map((group) => {
                              const open = group.slots.filter(
                                (slot) => slot.available,
                              ).length;

                              return (
                                <div key={group.key}>
                                  <div className="flex items-baseline justify-between gap-3">
                                    <h3 className="text-lg font-semibold text-text-primary">
                                      {group.heading}
                                    </h3>

                                    <span className="text-sm text-text-tertiary">
                                      {open} open
                                    </span>
                                  </div>

                                  <ul className="mt-3 space-y-1">
                                    {group.slots.map((slot) => (
                                      <li key={slot.id}>
                                        <SlotCard
                                          slot={slot}
                                          selected={slot.id === selectedId}
                                          onSelect={handleSelect}
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )
                    )}
                  </div>
                </section>


              </div>
            </RevealSection>
          </>
        )}

        {showBookingModal && selectedSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="max-w-lg">
              <BookingForm
                key={selectedSlot.id}
                slot={selectedSlot}
                onBooked={(booking) => {
                  handleBooked(booking);
                  setShowBookingModal(false);
                }}
                onChangeSlot={() => {
                  setSelectedId(null);
                  setShowBookingModal(false);
                }}
                onServerError={handleServerError}
              />
            </div>
          </div>
        )}
      </main>


      {showBookingModal && selectedSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowBookingModal(false);
              setSelectedId(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-default bg-surface-base p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2
                id="booking-modal-title"
                className="text-xl font-semibold text-text-primary"
              >
                Complete your booking
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedId(null);
                }}
                aria-label="Close booking form"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-raised hover:text-text-primary"
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  &times;
                </span>
              </button>
            </div>

            <BookingForm
              key={selectedSlot.id}
              slot={selectedSlot}
              onBooked={handleBooked}
              onChangeSlot={() => {
                setShowBookingModal(false);
                setSelectedId(null);
              }}
              onServerError={handleServerError}
            />
          </div>
        </div>
      )}


      <footer className="border-t border-border-default bg-surface-raised">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-6 text-sm text-text-tertiary sm:flex-row sm:justify-between sm:px-6 lg:flex lg:justify-center">
          <p>2026 CarePoint Clinic. All rights reserved.</p>
        </div>
      </footer>

      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onSaved={() => void loadSlots()}
        />
      )}
    </div>
  );
}
