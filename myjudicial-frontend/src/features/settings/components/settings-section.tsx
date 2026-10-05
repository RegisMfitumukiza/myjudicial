"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Card shell for one independently-saved settings section.
 *
 * Each section owns its own draft state and dirty tracking; the shell only
 * renders the header, description and the Save button. Sections always persist
 * via a per-key PUT (`updateSettingsSchema` accepts any subset), so saving one
 * section never touches another.
 */
export function SettingsSection({
  icon: Icon,
  title,
  description,
  dirty,
  saving,
  onSave,
  saveLabel,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  saveLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-2xl border border-border shadow-xs", className)}>
      <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-5 w-5 shrink-0 text-primary" />
            <CardTitle className="text-sm sm:text-base font-bold text-foreground break-words">{title}</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving || !dirty}
            className="shrink-0 font-bold self-end sm:self-auto w-full min-[480px]:w-auto"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            {saveLabel}
          </Button>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">{children}</CardContent>
    </Card>
  );
}