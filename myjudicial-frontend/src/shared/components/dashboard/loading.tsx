import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function LoadingSpinner({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground",
        className
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none text-primary" />
      {label && <p className="text-sm">{label}</p>}
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading card"
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-3 w-2/3" />
      <Skeleton className="mt-4 h-3 w-1/2" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function SkeletonList({
  count = 3,
  className,
  itemClassName,
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-busy="true"
      aria-label="Loading list"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("h-20 rounded-xl", itemClassName)} />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  columns = 3,
  className,
}: {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        {
          "grid-cols-1": columns === 1,
          "grid-cols-1 md:grid-cols-2": columns === 2,
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3": columns === 3,
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4": columns === 4,
        },
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading items"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function TableSectionSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
  className,
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden shadow-sm",
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading table data"
    >
      {/* Mobile Card List Placeholder */}
      <div className="md:hidden divide-y divide-border">
        {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Placeholder */}
      <div className="hidden md:block">
        {showHeader && (
          <div className="border-b border-border bg-muted/40 px-6 py-3.5 flex items-center justify-between gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn("h-3.5 rounded", i === 0 ? "w-28" : "w-16")}
              />
            ))}
          </div>
        )}
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 w-44">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              </div>
              {Array.from({ length: Math.max(columns - 2, 1) }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-16 rounded" />
              ))}
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function DetailPageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse motion-reduce:animate-none",
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading details"
    >
      {/* Back navigation & title header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-56 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-40 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Main 2-column detail grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-40 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-4 w-36 rounded" />
                </div>
              ))}
            </div>
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-36 rounded" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <div className="space-y-2.5 pt-2 border-t border-border">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-4/5 rounded" />
              <Skeleton className="h-3.5 w-2/3 rounded" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function FormSectionSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-sm space-y-5",
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading form"
    >
      <div className="space-y-1.5 border-b border-border pb-4">
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-3.5 w-64 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function CalendarSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm space-y-4",
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading calendar"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`hdr-${i}`} className="h-6 w-full rounded" />
        ))}
        {Array.from({ length: 28 }).map((_, i) => (
          <Skeleton
            key={`cell-${i}`}
            className="h-20 sm:h-24 w-full rounded-lg"
          />
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function PortalShellSkeleton() {
  return (
    <div
      className="flex min-h-screen w-full bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      {/* Sidebar Skeleton (Desktop) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-border bg-card p-4 space-y-6 shrink-0">
        <div className="flex items-center gap-3 px-2 py-1">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-28 rounded" />
        </div>
        <div className="space-y-2 flex-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-4 flex items-center gap-3 px-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navbar Skeleton */}
        <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg lg:hidden" />
            <Skeleton className="h-5 w-40 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full hidden sm:block" />
          </div>
        </header>

        {/* Page Body Skeleton */}
        <main className="flex-1">
          <DashboardSkeleton />
        </main>
      </div>
      <span className="sr-only">Loading workspace</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      {/* Primary KPI grid */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Secondary KPI grid */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded" />
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3"
            >
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Activity & Chart split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function TableSkeleton({
  statsCount = 4,
  columns = 6,
  rows = 6,
}: {
  statsCount?: number;
  columns?: number;
  rows?: number;
}) {
  return (
    <div
      className="space-y-6 p-2 min-[360px]:p-4 sm:p-6 lg:p-8 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading table page"
    >
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>

      {/* Stats Cards Row */}
      {statsCount > 0 && (
        <div
          className={cn("grid gap-3 sm:gap-4", {
            "grid-cols-2 sm:grid-cols-4": statsCount === 4,
            "grid-cols-2 md:grid-cols-5": statsCount === 5,
            "grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6":
              statsCount >= 6,
          })}
        >
          {Array.from({ length: statsCount }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-16 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Responsive Table Section */}
      <TableSectionSkeleton rows={rows} columns={columns} />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div
      className="space-y-6 p-6 lg:p-8 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading analytics"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        {/* Period Selector Tabs */}
        <Skeleton className="h-10 w-72 rounded-xl" />
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
