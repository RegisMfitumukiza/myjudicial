import * as React from "react";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { Button } from "@/shared/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {backHref && (
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1 text-muted-foreground">
          <Link href={backHref}>&larr; {backLabel}</Link>
        </Button>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground break-words">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
