"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  Diff,
  FileCode,
  GitCommit,
  History,
  Layers,
  Loader2,
  RotateCcw,
  User,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { StatusBadge } from "@/shared/components/dashboard/status-badge";
import type { ContentPageRevision } from "@/lib/api/content-pages";

interface RevisionDiffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revision: ContentPageRevision | null;
  currentDraft: {
    title: string;
    status: string;
    effectiveDate: string;
    metaTitle: string;
    metaDescription: string;
    openGraphImage: string;
    blocksCount: number;
  };
  onRestore: (revisionId: string) => void;
  restoring: boolean;
  locale: string;
}

function formatFullTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "full",
      timeStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function RevisionDiffDialog({
  open,
  onOpenChange,
  revision,
  currentDraft,
  onRestore,
  restoring,
  locale,
}: RevisionDiffDialogProps) {
  if (!revision) return null;

  const authorDisplay =
    revision.authorName && revision.authorEmail
      ? `${revision.authorName} (${revision.authorEmail})`
      : revision.authorName || revision.authorEmail || "Admin";

  const revBlocks = revision.blocks || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Snapshot Revision Audit & Diff
            </DialogTitle>
            <div className="flex items-center gap-1.5">
              <StatusBadge tone={revision.status === "published" ? "success" : "neutral"}>
                {revision.status === "published" ? "Live" : "Draft"}
              </StatusBadge>
              <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border border-border bg-muted/60 text-foreground">
                {revision.changeType}
              </span>
            </div>
          </div>

          <DialogDescription className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {formatFullTime(revision.createdAt, locale)}
            </span>
            <span className="hidden sm:inline text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <User className="h-3 w-3 text-muted-foreground" />
              {authorDisplay}
            </span>
          </DialogDescription>
        </div>

        {/* Content Comparison Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Metadata Comparison Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 font-bold text-xs text-foreground border-b border-border flex items-center justify-between">
              <span>Field Comparison</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Snapshot vs Current Draft
              </span>
            </div>
            <div className="divide-y divide-border">
              {/* Title */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="font-semibold text-muted-foreground">Page Title</span>
                <div className="sm:col-span-2 space-y-1">
                  <div className="p-1.5 rounded-md bg-muted/30 border border-border/60">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Snapshot:
                    </span>
                    <span className="font-medium text-foreground">{revision.title || "(Empty)"}</span>
                  </div>
                  {revision.title !== currentDraft.title && (
                    <div className="p-1.5 rounded-md bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">
                        Current Editor:
                      </span>
                      <span className="font-medium text-amber-900 dark:text-amber-200">
                        {currentDraft.title || "(Empty)"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="font-semibold text-muted-foreground">Status</span>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <StatusBadge tone={revision.status === "published" ? "success" : "neutral"}>
                    {revision.status}
                  </StatusBadge>
                  {revision.status !== currentDraft.status && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <StatusBadge tone={currentDraft.status === "published" ? "success" : "neutral"}>
                        Current: {currentDraft.status}
                      </StatusBadge>
                    </>
                  )}
                </div>
              </div>

              {/* SEO Meta Title */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="font-semibold text-muted-foreground">SEO Meta Title</span>
                <div className="sm:col-span-2">
                  <p className="font-mono text-[11px] text-foreground">
                    {revision.metaTitle || <span className="text-muted-foreground italic">None</span>}
                  </p>
                </div>
              </div>

              {/* SEO Meta Description */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="font-semibold text-muted-foreground">SEO Description</span>
                <div className="sm:col-span-2">
                  <p className="text-[11px] text-foreground">
                    {revision.metaDescription || (
                      <span className="text-muted-foreground italic">None</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Social OG Image */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="font-semibold text-muted-foreground">OG Social Image</span>
                <div className="sm:col-span-2">
                  <p className="font-mono text-[11px] text-foreground">
                    {revision.openGraphImage || (
                      <span className="text-muted-foreground italic">None</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Blocks Summary in Snapshot */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 font-bold text-xs text-foreground border-b border-border flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Snapshot Sections ({revBlocks.length})
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Current draft: {currentDraft.blocksCount} sections
              </span>
            </div>
            <div className="divide-y divide-border/60 max-h-56 overflow-y-auto">
              {revBlocks.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  No sections in this revision snapshot.
                </p>
              ) : (
                revBlocks.map((block, idx) => (
                  <div key={block.id || idx} className="p-2.5 flex items-start gap-2.5">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-foreground capitalize">
                          {block.type}
                        </span>
                        {"heading" in block && block.heading && (
                          <span className="text-muted-foreground truncate">
                            — {block.heading}
                          </span>
                        )}
                        {"title" in block && block.title && (
                          <span className="text-muted-foreground truncate">
                            — {block.title}
                          </span>
                        )}
                      </div>
                      {"body" in block && block.body && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {block.body}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={restoring}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={() => onRestore(revision.id)}
            disabled={restoring}
            className="text-xs font-semibold gap-1.5"
          >
            {restoring ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Restore This Version
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
