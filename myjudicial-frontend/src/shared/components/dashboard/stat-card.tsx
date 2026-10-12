import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  action,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 sm:p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-1.5 min-w-0">
          <p className="min-w-0 flex-1 text-xs font-medium tracking-wide text-muted-foreground line-clamp-2">
            {label}
          </p>
          {Icon && (
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </div>
          )}
        </div>
        <p className="mt-2 text-lg sm:text-2xl font-semibold tracking-tight text-foreground tabular-nums truncate">
          {value}
        </p>
      </div>
      {(hint || action) && (
        <div className="mt-1.5 flex items-center justify-between gap-1.5 min-w-0">
          {hint && <p className="min-w-0 text-xs text-muted-foreground line-clamp-2">{hint}</p>}
          {action}
        </div>
      )}
    </div>
  );
}
