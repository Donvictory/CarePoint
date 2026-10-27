import type { Slot } from "../types/booking";
import { durationMinutes, formatTime } from "../utils/date";
import { TickMark } from "./Marks";

interface Props {
  slot: Slot;
  selected: boolean;
  onSelect: (slot: Slot) => void;
}

export default function SlotCard({ slot, selected, onSelect }: Props) {
  const disabled = !slot.available;
  const minutes = durationMinutes(slot.start, slot.end);

  const tone = disabled
    ? "cursor-not-allowed opacity-40"
    : selected
      ? "cursor-pointer bg-brand-600/15 border-brand-500"
      : "cursor-pointer border-transparent";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={() => onSelect(slot)}
      className={`flex min-h-16 w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:gap-5 ${tone}`}
    >
      <span className="flex w-24 shrink-0 flex-col leading-tight sm:w-28">
        <span
          className={`text-xl font-semibold tabular-nums ${disabled ? "line-through" : "text-text-primary"}`}
        >
          {formatTime(slot.start)}
        </span>
        <span className="text-xs text-text-tertiary">
          to {formatTime(slot.end)}
        </span>
      </span>

      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate font-medium text-text-primary">{slot.provider}</span>
        <span className="text-xs text-text-tertiary">
          {minutes} min visit
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2 text-sm font-medium">
        {disabled ? (
          <span className="text-text-tertiary">Booked</span>
        ) : selected ? (
          <>
            <span className="text-brand-400">Selected</span>
            <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-500 text-surface-base">
              <TickMark className="h-3.5 w-3.5" />
            </span>
          </>
        ) : (
          <>
            <span className="text-brand-400">Open</span>
            <span className="h-5 w-5 rounded border border-border-default" aria-hidden="true" />
          </>
        )}
      </span>
    </button>
  );
}
