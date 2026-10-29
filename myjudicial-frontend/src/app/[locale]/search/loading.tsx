export function SearchPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading search results"
    >
      {/* Top Search & Filter Bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3">
          <div className="h-10 flex-1 min-w-[220px] rounded-xl bg-muted animate-pulse motion-reduce:animate-none" />
          <div className="h-10 w-28 rounded-xl bg-muted animate-pulse motion-reduce:animate-none" />
          <div className="h-10 w-32 rounded-xl bg-muted animate-pulse motion-reduce:animate-none" />
          <div className="h-10 w-24 rounded-xl bg-muted animate-pulse motion-reduce:animate-none" />
        </div>
        {/* Category Filter Pills */}
        <div className="mx-auto mt-3 flex max-w-[1400px] items-center gap-2 overflow-x-hidden">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-8 w-24 shrink-0 rounded-full bg-muted animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      </div>

      {/* Split Layout */}
      <div className="mx-auto max-w-[1400px] p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Lawyer Cards Column */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div className="h-4 w-36 rounded bg-muted animate-pulse motion-reduce:animate-none" />
              <div className="h-4 w-24 rounded bg-muted animate-pulse motion-reduce:animate-none" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
                <div className="flex gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-muted animate-pulse motion-reduce:animate-none" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 rounded bg-muted animate-pulse motion-reduce:animate-none" />
                    <div className="h-3.5 w-32 rounded bg-muted animate-pulse motion-reduce:animate-none" />
                    <div className="h-3 w-40 rounded bg-muted animate-pulse motion-reduce:animate-none" />
                  </div>
                </div>
                <div className="h-12 rounded-xl bg-muted/60 animate-pulse motion-reduce:animate-none" />
              </div>
            ))}
          </div>

          {/* Right Map Placeholder */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="sticky top-28 h-[calc(100vh-8rem)] rounded-2xl border border-border bg-muted/40 animate-pulse motion-reduce:animate-none flex items-center justify-center">
              <div className="text-center p-6 space-y-2">
                <div className="h-10 w-10 rounded-full bg-muted mx-auto" />
                <div className="h-3.5 w-32 rounded bg-muted mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchLoading() {
  return <SearchPageSkeleton />;
}
