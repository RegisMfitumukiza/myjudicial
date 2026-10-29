export default function AboutLoading() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-12 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading about page"
    >
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <div className="mx-auto h-9 w-52 rounded-xl bg-muted" />
        <div className="mx-auto h-4 w-96 max-w-full rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-7 w-20 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
