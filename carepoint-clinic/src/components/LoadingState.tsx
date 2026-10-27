export default function LoadingState() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading appointments">
      {Array.from({ length: 2 }).map((_, group) => (
        <div key={group} className="mb-8">
          <div className="skeleton h-5 w-48" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, row) => (
              <div
                key={row}
                className="flex items-center justify-between rounded-lg border border-border-subtle px-4 py-4"
              >
                <div className="space-y-2">
                  <div className="skeleton h-5 w-20" />
                  <div className="skeleton h-3 w-14" />
                </div>
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-5 w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Loading appointments</span>
    </div>
  );
}
