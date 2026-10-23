import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header, { type ServiceStatus } from "./components/Header";
import SlotCard from "./components/SlotCard";
import BookingForm from "./components/BookingForm";
import BookingConfirmation from "./components/BookingConfirmation";
import LoadingState from "./components/LoadingState";
import ErrorState from "./components/ErrorState";
import ApiKeyPanel from "./components/ApiKeyPanel";
import { fetchSlots, toApiErrorInfo } from "./services/api";
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
  const sorted = [...slots].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const groups: DayGroup[] = [];
  for (const slot of sorted) {
    const key = dayKey(slot.start);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.slots.push(slot);
    else groups.push({ key, heading: formatDayHeading(slot.start), slots: [slot] });
  }
  return groups;
}

export default function App() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiErrorInfo | null>(null);
  const [status, setStatus] = useState<ServiceStatus>("checking");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const formAnchor = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const loadSlots = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchSlots();
      if (id !== requestId.current) return;
      setSlots(data);
      setStatus("connected");
      // Drop the selection if that slot is no longer bookable.
      setSelectedId((current) => {
        if (current && !data.some((s) => s.id === current && s.available)) {
          setNotice("The appointment you selected is no longer available. Please choose another.");
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
          : info.kind === "network" || info.kind === "timeout" || info.kind === "server"
            ? "unreachable"
            : "connected",
      );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const selectedSlot = slots?.find((s) => s.id === selectedId) ?? null;
  const groups = useMemo(() => (slots ? groupByDay(slots) : []), [slots]);

  function handleSelect(slot: Slot) {
    setNotice(null);
    setSelectedId(slot.id);
    // On narrow screens the form sits below the list, so bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        formAnchor.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  function handleBooked(booking: Booking) {
    if (!selectedSlot) return;
    setConfirmed({ booking, slot: selectedSlot });
    setSelectedId(null);
    setNotice(null);
    void loadSlots(); // so the booked slot now shows as unavailable
  }

  function handleServerError(info: ApiErrorInfo) {
    if (info.kind === "conflict" || info.kind === "not_found") {
      setSelectedId(null);
      setNotice(info.message);
      void loadSlots();
    }
    if (info.kind === "unauthorized") setStatus("unauthorized");
  }

  const availableCount = slots?.filter((s) => s.available).length ?? 0;
  const showSkeleton = loading && slots === null;
  const zone = slots && slots.length > 0 ? timeZoneLabel(slots[0].start) : "";

  return (
    <div className="min-h-screen">
      <Header status={status} onOpenSettings={() => setSettingsOpen(true)} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {confirmed ? (
          <BookingConfirmation
            booking={confirmed.booking}
            slot={confirmed.slot}
            onDone={() => setConfirmed(null)}
          />
        ) : (
          <>
            <div className="max-w-xl">
              <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                Book your clinic appointment
              </h1>
              <p className="mt-4 text-lg text-muted">
                Choose an available appointment with one of our healthcare providers.
              </p>
              <p className="mt-2 text-sm font-medium text-brand-700">
                Simple, secure appointment booking
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <section aria-labelledby="slots-heading">
                <div className="flex items-end justify-between gap-3 border-b-2 border-ink pb-2">
                  <div>
                    <h2 id="slots-heading" className="font-serif text-2xl font-semibold">
                      Available appointments
                    </h2>
                    {slots && slots.length > 0 && (
                      <p className="text-sm text-muted">
                        {availableCount} open
                        {zone ? `, times shown in ${zone}` : ""}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadSlots()}
                    disabled={loading}
                    className="min-h-11 cursor-pointer border border-ink px-3 text-sm font-medium disabled:opacity-60"
                  >
                    {loading && slots ? "Refreshing" : "Refresh"}
                  </button>
                </div>

                {notice && (
                  <p role="status" className="mt-4 border border-ink bg-notice-bg p-3 text-sm">
                    {notice}
                  </p>
                )}

                <div className="mt-6">
                  {showSkeleton ? (
                    <LoadingState />
                  ) : loadError && slots === null ? (
                    <ErrorState
                      title="We couldn't load appointments"
                      message={loadError.message}
                      onRetry={() => void loadSlots()}
                      action={
                        loadError.kind === "unauthorized"
                          ? { label: "Enter access key", onClick: () => setSettingsOpen(true) }
                          : undefined
                      }
                    />
                  ) : slots && slots.length === 0 ? (
                    <div className="border border-dashed border-ink p-8">
                      <h3 className="font-serif text-xl font-semibold">
                        No appointments available right now
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        New times are added regularly. Please check back soon.
                      </p>
                    </div>
                  ) : (
                    slots && (
                      <>
                        {loadError && (
                          <div className="mb-6">
                            <ErrorState
                              title="Couldn't refresh availability"
                              message={`${loadError.message} The list below may be out of date.`}
                              onRetry={() => void loadSlots()}
                            />
                          </div>
                        )}
                        {availableCount === 0 && (
                          <p className="mb-6 text-sm text-muted">
                            All appointments are currently booked. Please check back soon.
                          </p>
                        )}
                        <div aria-busy={loading} className="space-y-8">
                          {groups.map((group) => {
                            const open = group.slots.filter((s) => s.available).length;
                            return (
                              <div key={group.key}>
                                <div className="flex items-baseline justify-between gap-3">
                                  <h3 className="font-serif text-lg font-semibold">
                                    {group.heading}
                                  </h3>
                                  <span className="text-sm text-muted">{open} open</span>
                                </div>
                                <ul className="mt-2 divide-y divide-line border-y border-ink">
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

              <div ref={formAnchor} className="scroll-mt-4 lg:sticky lg:top-6">
                {selectedSlot ? (
                  <BookingForm
                    key={selectedSlot.id}
                    slot={selectedSlot}
                    onBooked={handleBooked}
                    onChangeSlot={() => setSelectedId(null)}
                    onServerError={handleServerError}
                  />
                ) : (
                  <div className="hidden border border-dashed border-ink p-6 lg:block">
                    <p className="font-serif text-lg font-semibold">Your booking slip</p>
                    <p className="mt-1 text-sm text-muted">
                      Pick an open time from the list and your details go here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {settingsOpen && (
        <ApiKeyPanel onClose={() => setSettingsOpen(false)} onSaved={() => void loadSlots()} />
      )}
    </div>
  );
}
