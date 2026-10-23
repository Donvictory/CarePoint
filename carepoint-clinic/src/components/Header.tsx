import { CarePointLogo } from "./CareLogo";

export type ServiceStatus = "checking" | "connected" | "unreachable" | "unauthorized";

const STATUS_COPY: Record<ServiceStatus, { label: string; swatch: string }> = {
  checking: { label: "Checking service", swatch: "bg-muted" },
  connected: { label: "Booking service connected", swatch: "bg-brand-600" },
  unreachable: { label: "Booking service unreachable", swatch: "bg-alert" },
  unauthorized: { label: "Access key needed", swatch: "bg-amber-600" },
};

interface Props {
  status: ServiceStatus;
  onOpenSettings: () => void;
}

export default function Header({ status, onOpenSettings }: Props) {
  const s = STATUS_COPY[status];
  return (
    <header className="border-b border-ink bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <CarePointLogo markSize={38} />

        <div className="flex shrink-0 items-center gap-4 text-sm">
          <span className="flex items-center gap-2 text-muted" role="status" title={s.label}>
            <span className={`h-2 w-2 ${s.swatch}`} aria-hidden="true" />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sr-only sm:hidden">{s.label}</span>
          </span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-11 cursor-pointer px-1 font-medium underline-offset-4 hover:underline"
          >
            Access key
          </button>
        </div>
      </div>
    </header>
  );
}
