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
    <div className="rounded-lg border border-alert-border bg-alert-bg p-5" role="alert">
      <div className="flex items-start gap-3">
        <BangMark className="mt-1 h-4 w-4 shrink-0 text-alert" />
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="btn-primary min-h-11 px-4 text-sm"
              >
                {retryLabel}
              </button>
            )}
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className="btn-secondary min-h-11 px-4 text-sm"
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
