export default function PublicLoading() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 space-y-10 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading page content"
    >
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <div className="mx-auto h-9 w-64 rounded-xl bg-muted" />
        <div className="mx-auto h-4 w-96 max-w-full rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
