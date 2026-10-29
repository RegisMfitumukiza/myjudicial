export function AiWorkspaceSkeleton() {
  return (
    <div
      className="flex h-[calc(100dvh-4rem)] flex-col bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading AI Legal Assistant"
    >
      {/* Top Step Header Skeleton */}
      <div className="border-b border-border/60 bg-background/80 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 rounded-full bg-muted animate-pulse motion-reduce:animate-none" />
            <div className="h-6 w-20 rounded-full bg-muted animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      </div>

      {/* Messages Scroll Area Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Assistant Welcome Bubble */}
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted animate-pulse motion-reduce:animate-none shrink-0" />
            <div className="space-y-2 rounded-2xl rounded-tl-sm border border-border/60 bg-muted/40 p-4 max-w-[85%] flex-1">
              <div className="h-4 w-48 rounded bg-muted animate-pulse motion-reduce:animate-none" />
              <div className="h-3.5 w-full rounded bg-muted animate-pulse motion-reduce:animate-none" />
              <div className="h-3.5 w-5/6 rounded bg-muted animate-pulse motion-reduce:animate-none" />
            </div>
          </div>

          {/* User Placeholder Bubble */}
          <div className="flex items-start justify-end gap-3">
            <div className="space-y-2 rounded-2xl rounded-tr-sm bg-primary/10 p-4 max-w-[70%] flex-1">
              <div className="h-3.5 w-full rounded bg-primary/20 animate-pulse motion-reduce:animate-none" />
              <div className="h-3.5 w-3/4 rounded bg-primary/20 animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="h-9 w-9 rounded-xl bg-primary/20 animate-pulse motion-reduce:animate-none shrink-0" />
          </div>

          {/* Assistant Response Placeholder Bubble */}
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted animate-pulse motion-reduce:animate-none shrink-0" />
            <div className="space-y-3 rounded-2xl rounded-tl-sm border border-border/60 bg-card p-5 max-w-[90%] flex-1 shadow-xs">
              <div className="h-4 w-36 rounded bg-muted animate-pulse motion-reduce:animate-none" />
              <div className="h-3.5 w-full rounded bg-muted animate-pulse motion-reduce:animate-none" />
              <div className="h-3.5 w-4/5 rounded bg-muted animate-pulse motion-reduce:animate-none" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-16 rounded-xl bg-muted/60 animate-pulse motion-reduce:animate-none" />
                <div className="h-16 rounded-xl bg-muted/60 animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Docked Bottom Input Bar Skeleton */}
      <div className="border-t border-border/60 bg-background/95 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <div className="h-11 flex-1 rounded-xl bg-muted animate-pulse motion-reduce:animate-none" />
          <div className="h-10 w-10 rounded-xl bg-muted animate-pulse motion-reduce:animate-none shrink-0" />
          <div className="h-10 w-10 rounded-xl bg-muted animate-pulse motion-reduce:animate-none shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default function AiLoading() {
  return <AiWorkspaceSkeleton />;
}
