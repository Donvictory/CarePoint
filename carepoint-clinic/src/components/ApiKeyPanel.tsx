import { useState, type FormEvent } from "react";
import { getApiKey, setApiKey } from "../services/api";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function ApiKeyPanel({ onClose, onSaved }: Props) {
  const [value, setValue] = useState(getApiKey());

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiKey(value);
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apikey-title"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-ink bg-paper p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="apikey-title" className="font-serif text-xl font-semibold">
            Booking service access key
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 cursor-pointer px-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          The booking service asks for an access key. It stays in this browser and is never part of
          the app code.
        </p>
        <label htmlFor="api-key" className="mt-4 block text-sm font-medium">
          Access key
        </label>
        <input
          id="api-key"
          type="password"
          autoComplete="off"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 block min-h-11 w-full border border-ink bg-white px-3 text-base"
        />
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 cursor-pointer border border-ink px-4 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-11 cursor-pointer bg-brand-600 px-4 text-sm font-medium text-white"
          >
            Save and reload
          </button>
        </div>
      </form>
    </div>
  );
}
