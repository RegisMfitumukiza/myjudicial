"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  SlidersHorizontal,
  Layers,
  MoveHorizontal,
  Clock,
  HardDrive,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalTableProps {
  columns: string[];
  rows: string[][];
  scrollHint?: string;
  className?: string;
}

function renderSingleCategoryBadge(value: string) {
  const isNecessary = /necessary|nécessaire|byanze bikunze/i.test(value);
  const isPreferences = /preferences|préférences|amahitamo/i.test(value);
  const isFunctional = /functional|fonctionnel|imikorere/i.test(value);

  if (isNecessary) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 shadow-2xs">
        <ShieldCheck size={12} className="shrink-0 text-blue-600 dark:text-blue-400" />
        <span>{value}</span>
      </span>
    );
  }

  if (isPreferences) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 shadow-2xs">
        <SlidersHorizontal size={12} className="shrink-0 text-purple-600 dark:text-purple-400" />
        <span>{value}</span>
      </span>
    );
  }

  if (isFunctional) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs">
        <Layers size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>{value}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-border bg-accent/60 px-2.5 py-0.5 text-[11px] font-medium text-foreground">
      {value}
    </span>
  );
}

function renderCategoryBadges(value: string) {
  const parts = value.split("/").map((p) => p.trim());
  if (parts.length > 1) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {parts.map((p, idx) => (
          <span key={idx}>{renderSingleCategoryBadge(p)}</span>
        ))}
      </div>
    );
  }
  return renderSingleCategoryBadge(value);
}

export function LegalTable({ columns, rows, scrollHint, className }: LegalTableProps) {
  const t = useTranslations("legalPages.cookies.table");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const purposeIdx = columns.length - 1;
  const is6Col = columns.length >= 6;

  return (
    <div className={cn("mt-5 space-y-3", className)}>
      {/* View Mode Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border bg-card/60 px-3.5 py-2 shadow-2xs">
        <span className="text-xs font-semibold text-muted-foreground">
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
        </span>

        <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition",
              viewMode === "cards"
                ? "bg-accent font-semibold text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid size={13} />
            <span>{t("cardsView")}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition",
              viewMode === "table"
                ? "bg-accent font-semibold text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TableIcon size={13} />
            <span>{t("tableView")}</span>
          </button>
        </div>
      </div>

      {/* Cards View (Specification Grid) */}
      {viewMode === "cards" ? (
        <div className="grid gap-3.5">
          {rows.map((row, rIdx) => {
            const tokenName = row[0];
            const categoryVal = row[is6Col ? 1 : 2] || "";
            const providerVal = is6Col ? row[2] : undefined;
            const mechanismVal = !is6Col ? row[1] : undefined;
            const storageTypeVal = is6Col ? row[3] : undefined;
            const durationVal = row[is6Col ? 4 : 3] || "";
            const purposeVal = row[purposeIdx] || "";

            return (
              <div
                key={rIdx}
                className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs transition hover:border-primary/40 hover:shadow-xs"
              >
                {/* Card Header: Identifier + Category Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="inline-block max-w-full truncate rounded-lg border border-border/80 bg-muted/80 px-2.5 py-1 font-mono text-xs sm:text-sm font-bold text-foreground tracking-tight">
                      {tokenName}
                    </code>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {renderCategoryBadges(categoryVal)}
                  </div>
                </div>

                {/* Card Specs Grid */}
                <div className="mt-3.5 grid gap-2.5 sm:grid-cols-3 rounded-xl border border-border/60 bg-accent/30 p-3 text-xs">
                  {mechanismVal ? (
                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <HardDrive size={11} className="shrink-0" />
                        {columns[1]}
                      </span>
                      <code className="mt-1 inline-block rounded bg-muted/70 px-1.5 py-0.5 font-mono text-xs text-foreground">
                        {mechanismVal}
                      </code>
                    </div>
                  ) : null}

                  {providerVal ? (
                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <Globe size={11} className="shrink-0" />
                        {columns[2]}
                      </span>
                      <p className="mt-1 font-medium text-foreground">{providerVal}</p>
                    </div>
                  ) : null}

                  {storageTypeVal ? (
                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <HardDrive size={11} className="shrink-0" />
                        {columns[3]}
                      </span>
                      <p className="mt-1 font-medium text-foreground">{storageTypeVal}</p>
                    </div>
                  ) : null}

                  <div>
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Clock size={11} className="shrink-0" />
                      {columns[is6Col ? 4 : 3]}
                    </span>
                    <p className="mt-1 font-medium text-foreground">{durationVal}</p>
                  </div>
                </div>

                {/* Purpose Paragraph */}
                <div className="mt-4">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground mb-1">
                    {columns[purposeIdx]}
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground break-normal">
                    {purposeVal}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
          {/* Scroll hint bar */}
          <div className="flex items-center justify-between border-b border-border bg-accent/40 px-3.5 py-2 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MoveHorizontal size={13} className="shrink-0 text-muted-foreground" />
              <span>{scrollHint || t("scrollHint")}</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {columns.length} columns
            </span>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[860px] table-auto text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/60">
                  {columns.map((col, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === columns.length - 1;
                    return (
                      <th
                        key={col}
                        scope="col"
                        className={cn(
                          "px-4 py-3.5 font-semibold text-foreground sm:px-5 whitespace-nowrap",
                          isFirst && "min-w-[210px]",
                          idx === 1 && "min-w-[140px]",
                          idx === 2 && "min-w-[140px]",
                          idx === 3 && "min-w-[140px]",
                          idx === 4 && is6Col && "min-w-[130px]",
                          isLast && "min-w-[320px] whitespace-normal"
                        )}
                      >
                        {col}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="transition-colors hover:bg-muted/40">
                    {row.map((cell, cIdx) => {
                      const isFirst = cIdx === 0;
                      const isLast = cIdx === row.length - 1;
                      const colName = columns[cIdx]?.toLowerCase() || "";
                      const isCategory =
                        colName.includes("category") ||
                        colName.includes("catégorie") ||
                        colName.includes("icyiciro");
                      const isMechanism =
                        colName.includes("mechanism") ||
                        colName.includes("mécanisme") ||
                        colName.includes("uburyo");

                      let content;
                      if (isFirst) {
                        content = (
                          <code className="inline-block whitespace-nowrap rounded-md border border-border/80 bg-muted/80 px-2 py-0.5 font-mono text-xs font-semibold text-foreground tracking-tight">
                            {cell}
                          </code>
                        );
                      } else if (isCategory) {
                        content = renderCategoryBadges(cell);
                      } else if (isMechanism) {
                        content = (
                          <code className="inline-block whitespace-nowrap rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                            {cell}
                          </code>
                        );
                      } else if (isLast) {
                        content = (
                          <span className="block text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-normal break-normal">
                            {cell || "—"}
                          </span>
                        );
                      } else {
                        content = (
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-normal">
                            {cell || "—"}
                          </span>
                        );
                      }

                      return (
                        <td key={cIdx} className="px-4 py-3.5 align-top sm:px-5">
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
