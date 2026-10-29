"use client";

import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { Loader2, RotateCcw, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";

export interface AiAnalysisFormRecorderContext {
  value: string;
  disabled: boolean;
  appendText: (text: string) => void;
}

interface AiAnalysisFormProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  panelTitle?: string;
  panelIcon?: LucideIcon;
  placeholder: string;
  submitLabel: string;
  clearLabel: string;
  processingLabel: string;
  resultLabel?: string;
  idleHint?: string;
  processingHint?: string;
  rows?: number;
  onSubmit: (text: string) => Promise<void>;
  isPending: boolean;
  error: string | null;
  onClear?: () => void;
  recorder?: (ctx: AiAnalysisFormRecorderContext) => React.ReactNode;
  children?: React.ReactNode;
  extraResult?: React.ReactNode;
  className?: string;
}

export function AiAnalysisForm({
  title,
  description,
  icon: Icon,
  panelTitle,
  panelIcon: PanelIcon,
  placeholder,
  submitLabel,
  clearLabel,
  processingLabel,
  resultLabel,
  idleHint,
  processingHint,
  rows = 8,
  onSubmit,
  isPending,
  error,
  onClear,
  recorder,
  children,
  extraResult,
  className,
}: AiAnalysisFormProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isPending) return;
    await onSubmit(text);
  }, [input, isPending, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleClear = useCallback(() => {
    setInput("");
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  const appendText = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const hasResults = Boolean(children);

  return (
    <div className={cn("space-y-6", className)}>
      {(title || description) && (
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            {title && (
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            {panelTitle && (
              <div className="mb-4 flex items-center gap-2">
                {PanelIcon && (
                  <PanelIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                )}
                <h3 className="text-sm font-semibold text-foreground">{panelTitle}</h3>
              </div>
            )}

            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={rows}
              disabled={isPending}
              className="min-h-32 resize-none"
            />

            <div className="mt-3 flex items-center gap-2">
              {recorder?.({ value: input, disabled: isPending, appendText })}

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !input.trim()}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    {processingLabel}
                  </>
                ) : (
                  <>
                    <Send aria-hidden="true" />
                    {submitLabel}
                  </>
                )}
              </Button>

              {(input || hasResults) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  title={clearLabel}
                >
                  <RotateCcw aria-hidden="true" />
                  <span className="sr-only">{clearLabel}</span>
                </Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          {isPending ? (
            <div
              className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4 animate-pulse motion-reduce:animate-none"
              role="status"
              aria-busy="true"
              aria-label={processingLabel}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary motion-reduce:animate-none" />
                  <p className="text-sm font-semibold text-foreground">{processingLabel}</p>
                </div>
                <div className="h-5 w-20 rounded-full bg-muted" />
              </div>
              {processingHint && (
                <p className="text-xs text-muted-foreground">{processingHint}</p>
              )}
              <div className="space-y-3 pt-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-5/6 rounded bg-muted" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <div className="h-20 rounded-xl bg-muted/60" />
                <div className="h-20 rounded-xl bg-muted/60" />
              </div>
            </div>
          ) : !hasResults && !error ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center">
              {Icon && (
                <Icon className="mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
              )}
              {resultLabel && (
                <p className="text-sm font-medium text-muted-foreground">{resultLabel}</p>
              )}
              {idleHint && <p className="mt-1 text-xs text-muted-foreground">{idleHint}</p>}
            </div>
          ) : (
            hasResults && (
              <div className="space-y-4">
                {resultLabel && (
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">{resultLabel}</p>
                  </div>
                )}
                {children}
                {extraResult}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
