import type { Slot } from "../types/booking";
import { durationMinutes, formatTime } from "../utils/date";
import { TickMark } from "./Marks";

interface Props {
  slot: Slot;
  selected: boolean;
  onSelect: (slot: Slot) => void;
}

// One row of the day sheet: time, provider, status.
export default function SlotCard({ slot, selected, onSelect }: Props) {
  const disabled = !slot.available;
  const minutes = durationMinutes(slot.start, slot.end);

  const tone = disabled
    ? "cursor-not-allowed text-muted"
    : selected
      ? "cursor-pointer bg-ink text-paper"
      : "cursor-pointer";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={() => onSelect(slot)}
      className={`grid min-h-16 w-full grid-cols-[6.25rem_1fr_auto] items-center gap-3 px-3 py-3 text-left sm:grid-cols-[7.5rem_1fr_auto] sm:gap-5 sm:px-4 ${tone}`}
    >
      <span className="flex flex-col leading-tight">
        <span
          className={`font-serif text-xl font-medium tabular-nums ${disabled ? "line-through" : ""}`}
        >
          {formatTime(slot.start)}
        </span>
        <span className={`text-xs ${selected ? "text-paper/80" : "text-muted"}`}>
          to {formatTime(slot.end)}
        </span>
      </span>

      <span className="min-w-0 leading-tight">
        <span className="block truncate font-medium">{slot.provider}</span>
        <span className={`text-xs ${selected ? "text-paper/80" : "text-muted"}`}>
          {minutes} minute visit
        </span>
      </span>

      <span className="flex items-center gap-2 text-sm font-medium">
        {disabled ? (
          <span>Booked</span>
        ) : selected ? (
          <>
            <span>Selected</span>
            <span className="flex h-5 w-5 items-center justify-center bg-paper text-ink">
              <TickMark className="h-3.5 w-3.5" />
            </span>
          </>
        ) : (
          <>
            <span className="text-brand-700">Open</span>
            <span className="h-5 w-5 border border-ink" aria-hidden="true" />
          </>
        )}
      </span>
    </button>
  );
}
