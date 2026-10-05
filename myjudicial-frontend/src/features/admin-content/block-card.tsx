"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical, Upload, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { uploadContentImage } from "@/lib/api/upload";
import type { ContentBlock, ContentBlockType, CoreValueItem, MilestoneItem } from "@/lib/api/content-pages";

/**
 * Per-block-type field editors.
 *
 * The block set is closed, so each editor is exhaustive over its own type — no
 * generic JSON box, and no way to author a shape the public renderer does not
 * know how to draw.
 */

interface BlockCardProps {
  block: ContentBlock;
  index: number;
  total: number;
  canRemove: boolean;
  onChange: (next: ContentBlock) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}

const TYPE_LABEL_KEY: Record<ContentBlockType, string> = {
  prose: "blockProse",
  bullets: "blockBullets",
  steps: "blockSteps",
  callout: "blockCallout",
  table: "blockTable",
  coreValues: "blockCoreValues",
  milestones: "blockMilestones",
  contactCard: "blockContactCard",
  jobs: "blockJobs",
  faq: "blockFaq",
  hero: "blockHero",
  statsBand: "blockStatsBand",
  ctaBand: "blockCtaBand",
  image: "blockImage",
};

/** Blocks that render live platform data, so they carry no editable text. */
type DynamicBlock = Extract<ContentBlock, { type: "jobs" | "faq" | "contactCard" }>;

function isDynamicBlock(block: ContentBlock): block is DynamicBlock {
  return block.type === "jobs" || block.type === "faq" || block.type === "contactCard";
}

function ImageBlockFields({
  block,
  onChange,
}: {
  block: Extract<ContentBlock, { type: "image" }>;
  onChange: (next: ContentBlock) => void;
}) {
  const t = useTranslations("adminContent");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadContentImage(file);
      onChange({ ...block, src: result.url });
      toast.success("Image uploaded successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {block.src ? (
        <div className="relative aspect-[16/9] max-h-48 w-full overflow-hidden rounded-lg border border-border bg-muted/40">
          <img
            src={block.src}
            alt={block.alt || "Uploaded image"}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <Label className="text-xs">{t("imageSrc")}</Label>
        <div className="flex gap-2">
          <Input
            value={block.src}
            onChange={(e) => onChange({ ...block, src: e.target.value })}
            className="h-9 flex-1 text-xs"
            placeholder="https://... or upload an image"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 text-xs"
          >
            {uploading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-3.5 w-3.5" />
            )}
            Upload Image
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t("imageAlt")}</Label>
        <Input
          value={block.alt}
          onChange={(e) => onChange({ ...block, alt: e.target.value })}
          className="h-9 text-xs"
          placeholder="Accessible description of the image"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t("imageCaption")}</Label>
        <Input
          value={block.caption ?? ""}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          className="h-9 text-xs"
          placeholder="Optional caption under image"
        />
      </div>
    </div>
  );
}

export function BlockCard({
  block,
  index,
  total,
  canRemove,
  onChange,
  onRemove,
  onMove,
}: BlockCardProps) {
  const t = useTranslations("adminContent");

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t(TYPE_LABEL_KEY[block.type])}
        </span>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          aria-label={t("moveUp")}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          aria-label={t("moveDown")}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label={t("removeBlock")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="space-y-3 p-3">
        {isDynamicBlock(block) ? (
          <p className="text-xs text-muted-foreground">{t(`dynamic_${block.type}` as never)}</p>
        ) : (
          <BlockFields block={block} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: Exclude<ContentBlock, { type: "jobs" } | { type: "faq" } | { type: "contactCard" }>;
  onChange: (next: ContentBlock) => void;
}) {
  const t = useTranslations("adminContent");

  const heading = (value: string) => onChange({ ...block, heading: value || undefined } as ContentBlock);

  if (block.type === "table") {
    return <TableFields block={block} onChange={onChange} />;
  }

  if (block.type === "coreValues") {
    return <CoreValuesFields block={block} onChange={onChange} />;
  }

  if (block.type === "milestones") {
    return <MilestonesFields block={block} onChange={onChange} />;
  }

  if (block.type === "bullets" || block.type === "steps") {
    const setItem = (i: number, value: string) => {
      const items = [...block.items];
      items[i] = value;
      onChange({ ...block, items });
    };
    return (
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">{t("headingOptional")}</Label>
          <Input
            value={block.heading ?? ""}
            onChange={(e) => heading(e.target.value)}
            placeholder={t("headingPlaceholder")}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("items")}</Label>
          {block.items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
              <Input
                value={item}
                onChange={(e) => setItem(i, e.target.value)}
                className="h-9"
                aria-label={`${t("items")} ${i + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => onChange({ ...block, items: block.items.filter((_, x) => x !== i) })}
                aria-label={t("removeItem")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("addItem")}
          </Button>
        </div>
      </div>
    );
  }

  if (block.type === "callout") {
    return (
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">{t("headingOptional")}</Label>
          <Input
            value={block.heading ?? ""}
            onChange={(e) => heading(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("tone")}</Label>
          <div className="flex gap-1.5">
            {(["info", "warning"] as const).map((tone) => (
              <Button
                key={tone}
                type="button"
                variant={block.tone === tone ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => onChange({ ...block, tone })}
              >
                {t(`tone_${tone}` as never)}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("body")}</Label>
          <Textarea
            value={block.body}
            onChange={(e) => onChange({ ...block, body: e.target.value })}
            aria-label={t("body")}
            rows={3}
          />
        </div>
      </div>
    );
  }

  if (block.type === "hero") {
    return (
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">{t("heroBadge")}</Label>
          <Input
            value={block.badge ?? ""}
            onChange={(e) => onChange({ ...block, badge: e.target.value })}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("heroTitle")}</Label>
          <Input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("heroSubtitle")}</Label>
          <Textarea
            value={block.subtitle ?? ""}
            onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
            rows={3}
          />
        </div>
        <CtaFields
          ctaLabel={block.ctaLabel ?? ""}
          ctaHref={block.ctaHref ?? ""}
          onChange={({ ctaLabel, ctaHref }) => onChange({ ...block, ctaLabel, ctaHref })}
          t={t}
        />
      </div>
    );
  }

  if (block.type === "statsBand") {
    return (
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">{t("headingOptional")}</Label>
          <Input
            value={block.heading ?? ""}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("statValues")}</Label>
          {block.stats.map((stat, i) => (
            <div key={stat.id} className="grid grid-cols-[1fr_2fr_auto] items-center gap-1.5">
              <Input
                value={stat.value}
                onChange={(e) =>
                  onChange({
                    ...block,
                    stats: block.stats.map((s, x) => (x === i ? { ...s, value: e.target.value } : s)),
                  })
                }
                className="h-9"
                aria-label={`${t("statValue")} ${i + 1}`}
              />
              <Input
                value={stat.label}
                onChange={(e) =>
                  onChange({
                    ...block,
                    stats: block.stats.map((s, x) => (x === i ? { ...s, label: e.target.value } : s)),
                  })
                }
                className="h-9"
                aria-label={`${t("statLabel")} ${i + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() =>
                  onChange({ ...block, stats: block.stats.filter((_, x) => x !== i) })
                }
                aria-label={t("removeStat")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() =>
              onChange({
                ...block,
                stats: [...block.stats, { id: newEntryId("stat"), value: "", label: "" }],
              })
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("addStat")}
          </Button>
        </div>
      </div>
    );
  }

  if (block.type === "ctaBand") {
    return (
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">{t("headingOptional")}</Label>
          <Input
            value={block.heading ?? ""}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("body")}</Label>
          <Textarea
            value={block.body ?? ""}
            onChange={(e) => onChange({ ...block, body: e.target.value })}
            aria-label={t("body")}
            rows={3}
          />
        </div>
        <CtaFields
          ctaLabel={block.ctaLabel}
          ctaHref={block.ctaHref}
          onChange={({ ctaLabel, ctaHref }) => onChange({ ...block, ctaLabel, ctaHref })}
          t={t}
        />
      </div>
    );
  }

  if (block.type === "image") {
    return <ImageBlockFields block={block} onChange={onChange} />;
  }

  // prose
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">{t("headingOptional")}</Label>
        <Input
          value={block.heading ?? ""}
          onChange={(e) => heading(e.target.value)}
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("body")}</Label>
        <Textarea
          value={block.body}
          onChange={(e) => onChange({ ...block, body: e.target.value })}
          aria-label={t("body")}
          rows={6}
        />
      </div>
    </div>
  );
}

function CtaFields({
  ctaLabel,
  ctaHref,
  onChange,
  t,
}: {
  ctaLabel: string;
  ctaHref: string;
  onChange: (next: { ctaLabel: string; ctaHref: string }) => void;
  t: ReturnType<typeof useTranslations<"adminContent">>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1">
        <Label className="text-xs">{t("ctaLabel")}</Label>
        <Input
          value={ctaLabel}
          onChange={(e) => onChange({ ctaLabel: e.target.value, ctaHref })}
          className="h-9"
          aria-label={t("ctaLabel")}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("ctaHref")}</Label>
        <Input
          value={ctaHref}
          onChange={(e) => onChange({ ctaLabel, ctaHref: e.target.value })}
          className="h-9"
          aria-label={t("ctaHref")}
        />
      </div>
    </div>
  );
}

function TableFields({
  block,
  onChange,
}: {
  block: Extract<ContentBlock, { type: "table" }>;
  onChange: (next: ContentBlock) => void;
}) {
  const t = useTranslations("adminContent");

  const setColumn = (i: number, value: string) => {
    const columns = [...block.columns];
    columns[i] = value;
    onChange({ ...block, columns });
  };

  const setCell = (r: number, c: number, value: string) => {
    const rows = block.rows.map((row) => [...row]);
    rows[r][c] = value;
    onChange({ ...block, rows });
  };

  const addRow = () => {
    const blank = block.columns.map(() => "");
    onChange({ ...block, rows: [...block.rows, blank] });
  };

  const removeRow = (r: number) => {
    onChange({ ...block, rows: block.rows.filter((_, i) => i !== r) });
  };

  // A column cannot be removed without rewriting every row, so the UI keeps a
  // fixed width and the backend rejects any table whose rows disagree with the
  // column count. Removing a column pads/truncates rows to stay valid.
  const removeColumn = (c: number) => {
    if (block.columns.length <= 1) return;
    const columns = block.columns.filter((_, i) => i !== c);
    const rows = block.rows.map((row) => row.filter((_, i) => i !== c));
    onChange({ ...block, columns, rows });
  };

  const addColumn = () => {
    const columns = [...block.columns, t("newColumn")];
    const rows = block.rows.map((row) => [...row, ""]);
    onChange({ ...block, columns, rows });
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">{t("headingOptional")}</Label>
        <Input
          value={block.heading ?? ""}
          onChange={(e) => onChange({ ...block, heading: e.target.value || undefined })}
          className="h-9"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t("columns")}</Label>
        {block.columns.map((col, c) => (
          <div key={c} className="flex items-center gap-1.5">
            <Input
              value={col}
              onChange={(e) => setColumn(c, e.target.value)}
              className="h-9"
              aria-label={`${t("columns")} ${c + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              disabled={block.columns.length <= 1}
              onClick={() => removeColumn(c)}
              aria-label={t("removeColumn")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={addColumn}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("addColumn")}
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t("rows")}</Label>
        {block.rows.map((row, r) => (
          <div key={r} className="space-y-1 rounded border border-border p-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                {t("row")} {r + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => removeRow(r)}
                aria-label={`${t("removeRow")} ${r + 1}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {row.map((cell, c) => (
                <Input
                  key={c}
                  value={cell}
                  onChange={(e) => setCell(r, c, e.target.value)}
                  className="h-8 text-xs"
                  placeholder={block.columns[c]}
                  aria-label={`${t("row")} ${r + 1} ${block.columns[c] ?? c + 1}`}
                />
              ))}
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={addRow}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("addRow")}
        </Button>
      </div>
    </div>
  );
}

/** Generates a short, unique-enough block id for newly added blocks. */
export function newBlockId(): string {
  return `b_${Math.random().toString(36).slice(2, 10)}`;
}

function newEntryId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const ICON_OPTIONS = [
  "ShieldCheck",
  "Scale",
  "Users",
  "Award",
  "Target",
  "Lock",
  "Heart",
  "Clock",
  "Globe",
  "Sparkles",
];

function CoreValuesFields({
  block,
  onChange,
}: {
  block: Extract<ContentBlock, { type: "coreValues" }>;
  onChange: (next: ContentBlock) => void;
}) {
  const t = useTranslations("adminContent");

  const setItem = (i: number, next: CoreValueItem) => {
    const values = block.values.map((v, index) => (index === i ? next : v));
    onChange({ ...block, values });
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">{t("headingOptional")}</Label>
        <Input
          value={block.heading ?? ""}
          onChange={(e) => onChange({ ...block, heading: e.target.value || undefined })}
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("values")}</Label>
        {block.values.map((value, i) => (
          <div key={value.id ?? i} className="space-y-2 rounded border border-border p-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground">{t("valueTitle")}</Label>
                <Input
                  value={value.title}
                  onChange={(e) => setItem(i, { ...value, title: e.target.value })}
                  className="h-8 text-xs"
                  aria-label={`${t("valueTitle")} ${i + 1}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground">{t("valueIcon")}</Label>
                <Select value={value.icon} onValueChange={(v) => setItem(i, { ...value, icon: v })}>
                  <SelectTrigger className="h-8 text-xs" aria-label={`${t("valueIcon")} ${i + 1}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-muted-foreground">{t("valueDescription")}</Label>
              <Input
                value={value.description}
                onChange={(e) => setItem(i, { ...value, description: e.target.value })}
                className="h-8 text-xs"
                aria-label={`${t("valueDescription")} ${i + 1}`}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-destructive hover:text-destructive"
              onClick={() => onChange({ ...block, values: block.values.filter((_, x) => x !== i) })}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> {t("removeItem")}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() =>
            onChange({
              ...block,
              values: [...block.values, { id: newEntryId("val"), title: "", description: "", icon: "ShieldCheck" }],
            })
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("addValue")}
        </Button>
      </div>
    </div>
  );
}

function MilestonesFields({
  block,
  onChange,
}: {
  block: Extract<ContentBlock, { type: "milestones" }>;
  onChange: (next: ContentBlock) => void;
}) {
  const t = useTranslations("adminContent");

  const setItem = (i: number, next: MilestoneItem) => {
    const items = block.items.map((v, index) => (index === i ? next : v));
    onChange({ ...block, items });
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">{t("headingOptional")}</Label>
        <Input
          value={block.heading ?? ""}
          onChange={(e) => onChange({ ...block, heading: e.target.value || undefined })}
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("milestoneItems")}</Label>
        {block.items.map((item, i) => (
          <div key={item.id ?? i} className="space-y-2 rounded border border-border p-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground">{t("milestoneYear")}</Label>
                <Input
                  value={item.year}
                  onChange={(e) => setItem(i, { ...item, year: e.target.value })}
                  className="h-8 text-xs font-mono font-bold"
                  aria-label={`${t("milestoneYear")} ${i + 1}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground">{t("milestoneTitle")}</Label>
                <Input
                  value={item.title}
                  onChange={(e) => setItem(i, { ...item, title: e.target.value })}
                  className="h-8 text-xs font-semibold"
                  aria-label={`${t("milestoneTitle")} ${i + 1}`}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-muted-foreground">{t("milestoneDesc")}</Label>
              <Input
                value={item.description}
                onChange={(e) => setItem(i, { ...item, description: e.target.value })}
                className="h-8 text-xs"
                aria-label={`${t("milestoneDesc")} ${i + 1}`}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-destructive hover:text-destructive"
              onClick={() => onChange({ ...block, items: block.items.filter((_, x) => x !== i) })}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> {t("removeItem")}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() =>
            onChange({
              ...block,
              items: [
                ...block.items,
                { id: newEntryId("m"), year: "", title: "", description: "" },
              ],
            })
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("addMilestone")}
        </Button>
      </div>
    </div>
  );
}
