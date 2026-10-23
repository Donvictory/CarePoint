import { BangMark } from "./Marks";

interface Props {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: { label: string; onClick: () => void };
}

export default function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = "Try again",
  action,
}: Props) {
  return (
    <div className="border border-alert bg-alert-bg p-5" role="alert">
      <div className="flex items-start gap-3">
        <BangMark className="mt-1 h-4 w-4 shrink-0 text-alert" />
        <div>
          <h3 className="font-serif text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm">{message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="min-h-11 cursor-pointer bg-brand-600 px-4 text-sm font-medium text-white"
              >
                {retryLabel}
              </button>
            )}
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className="min-h-11 cursor-pointer border border-ink px-4 text-sm font-medium"
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
