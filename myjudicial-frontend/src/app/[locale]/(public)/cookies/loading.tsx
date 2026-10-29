export default function CookiesLoading() {
  return (
    <div
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-6 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading cookie policy"
    >
      <div className="space-y-3 pb-6 border-b border-border">
        <div className="h-8 w-64 rounded-xl bg-muted" />
        <div className="h-4 w-40 rounded bg-muted" />
      </div>
      <div className="space-y-4 pt-4">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-4 w-4/6 rounded bg-muted" />
        <div className="h-24 w-full rounded-xl bg-muted/60 my-6" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}
