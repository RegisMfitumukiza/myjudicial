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
        "rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      {(hint || action) && (
        <div className="mt-1 flex items-center justify-between gap-2">
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {action}
        </div>
      )}
    </div>
  );
}
