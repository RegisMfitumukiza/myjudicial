export default function CareersLoading() {
  return (
    <div
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-8 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading careers"
    >
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <div className="h-8 w-48 rounded-xl bg-muted mx-auto" />
        <div className="h-4 w-80 max-w-full rounded bg-muted mx-auto" />
      </div>
      <div className="space-y-4 pt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-44 rounded bg-muted" />
              <div className="h-6 w-20 rounded-full bg-muted" />
            </div>
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
