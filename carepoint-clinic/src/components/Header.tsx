import { CarePointLogo } from "./CareLogo";

export type ServiceStatus = "checking" | "connected" | "unreachable" | "unauthorized";

const STATUS_COPY: Record<ServiceStatus, { label: string; color: string }> = {
  checking: { label: "Checking service", color: "bg-text-tertiary" },
  connected: { label: "Connected", color: "bg-success" },
  unreachable: { label: "Service unreachable", color: "bg-alert" },
  unauthorized: { label: "API key needed", color: "bg-amber-500" },
};

interface Props {
  status: ServiceStatus;
}

export default function Header({ status }: Props) {
  const s = STATUS_COPY[status];
  return (
    <header className="border-b border-border-default bg-surface-raised">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <CarePointLogo markSize={36} />

        <span className="flex items-center gap-2 text-sm text-text-secondary" role="status" title={s.label}>
          <span className={`h-2 w-2 rounded-full ${s.color}`} aria-hidden="true" />
          <span className="hidden sm:inline">{s.label}</span>
          <span className="sr-only sm:hidden">{s.label}</span>
        </span>
      </div>
    </header>
  );
}
