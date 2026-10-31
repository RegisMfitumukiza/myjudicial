"use client";

import { Clock, History, RotateCcw, User } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { FaqSnapshot } from "./snapshots-history";

interface FaqHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshots: FaqSnapshot[];
  onRestore: (snapshot: FaqSnapshot) => void;
  locale: string;
}

function formatFullTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function FaqHistoryDialog({
  open,
  onOpenChange,
  snapshots,
  onRestore,
  locale,
}: FaqHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <div className="p-5 pb-3 border-b border-border space-y-1">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Public FAQs Snapshot History & Recovery
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Audit log of previously saved FAQ datasets. Restore any past version to revert changes.
          </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {snapshots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No saved snapshots recorded yet. Snapshots are created each time you save FAQs.
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 transition-all hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatFullTime(snap.savedAt, locale)}</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        ({snap.count} FAQs)
                      </span>
                    </div>
                    {snap.authorEmail && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Saved by {snap.authorEmail}</span>
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRestore(snap);
                      onOpenChange(false);
                    }}
                    className="h-8 text-xs font-semibold gap-1 shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore</span>
                  </Button>
                </div>

                {/* Preview of first 2 questions */}
                {snap.faqs && snap.faqs.length > 0 && (
                  <div className="rounded-lg bg-muted/30 border border-border/60 p-2 space-y-1 text-[11px]">
                    {snap.faqs.slice(0, 2).map((faq, i) => (
                      <p key={faq.id || i} className="text-muted-foreground truncate">
                        <strong>Q:</strong> {faq.question || "(Untitled question)"}
                      </p>
                    ))}
                    {snap.faqs.length > 2 && (
                      <p className="text-[10px] text-muted-foreground italic">
                        + {snap.faqs.length - 2} more FAQ items in this snapshot
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
