export function CrossMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
    </svg>
  );
}

export function TickMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="M3 8.5l3.2 3.2L13 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function BangMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7.1" y="3.6" width="1.8" height="5.6" fill="currentColor" />
      <rect x="7.1" y="10.4" width="1.8" height="1.8" fill="currentColor" />
    </svg>
  );
}
