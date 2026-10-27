import { useEffect, useRef, useState, type FormEvent } from "react";
import { getApiKey, setApiKey } from "../services/api";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function ApiKeyModal({ onClose, onSaved }: Props) {
  const [value, setValue] = useState(getApiKey());
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Please enter your API key to continue.");
      inputRef.current?.focus();
      return;
    }

    setError(null);
    setApiKey(trimmed);
    onSaved();
    onClose();
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apikey-modal-title"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border-default bg-surface-raised p-6"
      >
        <h2 id="apikey-modal-title" className="text-xl font-semibold text-text-primary">
          Enter your API key
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          The booking service requires an API key to load appointments.
          Your key stays in this browser and is never sent anywhere else.
        </p>

        <label htmlFor="api-key-input" className="mt-5 block text-sm font-medium text-text-primary">
          API key
        </label>
        <input
          ref={inputRef}
          id="api-key-input"
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste your API key here"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "api-key-error" : undefined}
          className={`mt-2 block min-h-12 w-full rounded-lg border bg-surface-base px-4 text-base text-text-primary placeholder:text-text-tertiary outline-none transition-colors ${
            error
              ? "border-alert focus:border-alert"
              : "border-border-default focus:border-text-secondary"
          }`}
        />
        {error && (
          <p id="api-key-error" role="alert" className="mt-2 text-sm text-alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary min-h-11 px-4 text-sm"
          >
            Skip
          </button>
          <button
            type="submit"
            className="btn-primary min-h-11 px-4 text-base"
          >
            Save and connect
          </button>
        </div>
      </form>
    </div>
  );
}
