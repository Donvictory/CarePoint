export default function LoadingState() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading appointments">
      {Array.from({ length: 2 }).map((_, group) => (
        <div key={group} className="mb-8 animate-pulse">
          <div className="h-5 w-48 bg-line" />
          <div className="mt-3 border-t border-ink">
            {Array.from({ length: 3 }).map((_, row) => (
              <div
                key={row}
                className="flex items-center justify-between border-b border-line px-3 py-4 sm:px-4"
              >
                <div className="space-y-2">
                  <div className="h-5 w-20 bg-line" />
                  <div className="h-3 w-14 bg-line" />
                </div>
                <div className="h-4 w-28 bg-line" />
                <div className="h-5 w-12 bg-line" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Loading appointments</span>
    </div>
  );
}
