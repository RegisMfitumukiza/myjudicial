import * as React from "react";

import { cn } from "@/lib/utils";

export type StatusTone =
  | "neutral"
  | "pending"
  | "active"
  | "success"
  | "destructive"
  | "info"
  | "warning";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  pending: "bg-warning/15 text-warning dark:bg-warning/20 dark:text-warning",
  active: "bg-primary/10 text-primary dark:bg-white/10 dark:text-white",
  success: "bg-primary/10 text-primary dark:bg-white/10 dark:text-white",
  destructive: "bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-red-400",
  info: "bg-primary/10 text-primary dark:bg-white/10 dark:text-white",
  warning: "bg-warning/15 text-warning dark:bg-warning/20 dark:text-warning",
};

interface StatusBadgeProps {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  title?: string;
}

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  dot = true,
  title,
}: StatusBadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />}
      {children}
    </span>
  );
}
