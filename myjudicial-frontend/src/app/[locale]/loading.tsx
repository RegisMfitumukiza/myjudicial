export default function RootLocaleLoading() {
  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading platform"
    >
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="h-8 w-36 rounded-xl bg-muted" />
          <div className="flex gap-3">
            <div className="h-8 w-20 rounded-lg bg-muted" />
            <div className="h-8 w-24 rounded-lg bg-muted" />
          </div>
        </div>
        <div className="space-y-4 pt-4">
          <div className="h-10 w-2/3 rounded-xl bg-muted" />
          <div className="h-5 w-1/2 rounded bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl border border-border bg-card p-6" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
