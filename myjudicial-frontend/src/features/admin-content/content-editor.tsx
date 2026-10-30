"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  FileText,
  History,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { StatusBadge } from "@/shared/components/dashboard/status-badge";
import { FormSectionSkeleton, SkeletonList } from "@/shared/components/dashboard/loading";
import { getErrorMessage } from "@/lib/utils";
import {
  CONTENT_LOCALES,
  type ContentBlock,
  type ContentBlockType,
  type ContentLocale,
  type ContentPage,
  type ContentPageRevision,
  type ContentPageSlug,
  copyContentPage,
  deleteContentPage,
  fetchAdminContentPages,
  fetchContentBlueprint,
  fetchContentPageRevisions,
  fetchContentSchema,
  restoreContentPageRevision,
  saveContentPage,
} from "@/lib/api/content-pages";
import { BlockCard, newBlockId } from "./block-card";

/**
 * Admin editor for the public content pages.
 *
 * Nothing here writes layout — the admin chooses what a page says and the
 * public renderer decides how it looks. A page that has never been saved starts
 * as a draft, so the public site keeps showing the neutral unpublished state
 * until an admin deliberately publishes.
 */

const SLUG_ORDER: ContentPageSlug[] = [
  "ABOUT",
  "CAREERS",
  "HELP",
  "CONTACT",
  "PRIVACY",
  "TERMS",
  "COOKIES",
];

function formatRevisionTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso)
  );
}

/** Starter blocks so a new page is a working skeleton, never invented copy. */
const NEW_BLOCK_TEMPLATES: Partial<Record<ContentBlockType, () => ContentBlock>> = {
  prose: () => ({ id: newBlockId(), type: "prose", heading: "", body: "" }),
  bullets: () => ({ id: newBlockId(), type: "bullets", heading: "", items: [""] }),
  steps: () => ({ id: newBlockId(), type: "steps", heading: "", items: [""] }),
  callout: () => ({ id: newBlockId(), type: "callout", heading: "", body: "", tone: "info" }),
  table: () => ({
    id: newBlockId(),
    type: "table",
    heading: "",
    columns: ["", ""],
    rows: [["", ""]],
  }),
  coreValues: () => ({
    id: newBlockId(),
    type: "coreValues",
    heading: "",
    values: [{ id: `val_${newBlockId()}`, title: "", description: "", icon: "ShieldCheck" }],
  }),
  milestones: () => ({
    id: newBlockId(),
    type: "milestones",
    heading: "",
    items: [{ id: `m_${newBlockId()}`, year: "", title: "", description: "" }],
  }),
  contactCard: () => ({ id: newBlockId(), type: "contactCard" }),
  jobs: () => ({ id: newBlockId(), type: "jobs" }),
  faq: () => ({ id: newBlockId(), type: "faq" }),
  hero: () => ({
    id: newBlockId(),
    type: "hero",
    badge: "",
    title: "",
    subtitle: "",
    ctaLabel: "",
    ctaHref: "",
  }),
  statsBand: () => ({
    id: newBlockId(),
    type: "statsBand",
    heading: "",
    stats: [{ id: `stat_${newBlockId()}`, value: "", label: "" }],
  }),
  ctaBand: () => ({
    id: newBlockId(),
    type: "ctaBand",
    heading: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
  }),
  image: () => ({ id: newBlockId(), type: "image", src: "", alt: "", caption: "" }),
};

interface DraftState {
  title: string;
  blocks: ContentBlock[];
  status: "draft" | "published";
  effectiveDate: string;
  metaTitle: string;
  metaDescription: string;
  openGraphImage: string;
}

const EMPTY_DRAFT: DraftState = {
  title: "",
  blocks: [],
  status: "draft",
  effectiveDate: "",
  metaTitle: "",
  metaDescription: "",
  openGraphImage: "",
};

/**
 * The editor for a single page+locale. Keyed by `slug:locale` from the parent,
 * so switching pages remounts this component and the draft state resets
 * naturally — there is no "sync fetched row into state" effect to get stale.
 */
function PageEditor({
  slug,
  locale,
  allowedTypes,
  page,
  allPages,
  onSaved,
  onDeleted,
}: {
  slug: ContentPageSlug;
  locale: ContentLocale;
  allowedTypes: readonly ContentBlockType[];
  page: ContentPage | undefined;
  allPages: ContentPage[];
  onSaved: (page: ContentPage) => void;
  onDeleted: (slug: ContentPageSlug, locale: ContentLocale) => void;
}) {
  const t = useTranslations("adminContent");
  const [draft, setDraft] = useState<DraftState>(() =>
    page
      ? {
          title: page.title,
          blocks: page.blocks,
          status: page.status,
          effectiveDate: page.effectiveDate ?? "",
          metaTitle: page.metaTitle ?? "",
          metaDescription: page.metaDescription ?? "",
          openGraphImage: page.openGraphImage ?? "",
        }
      : EMPTY_DRAFT
  );
  const [saved, setSaved] = useState<DraftState | null>(() =>
    page
      ? {
          title: page.title,
          blocks: page.blocks,
          status: page.status,
          effectiveDate: page.effectiveDate ?? "",
          metaTitle: page.metaTitle ?? "",
          metaDescription: page.metaDescription ?? "",
          openGraphImage: page.openGraphImage ?? "",
        }
      : null
  );
  const [saving, setSaving] = useState(false);
  const [newBlockType, setNewBlockType] = useState<ContentBlockType>("prose");
  const [revisions, setRevisions] = useState<ContentPageRevision[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const previewHref = `/${locale}/admin/dashboard/content/preview/${slug.toLowerCase()}`;

  const isDirty = useMemo(() => {
    if (!saved) return draft.title.trim() !== "" || draft.blocks.length > 0;
    return (
      saved.title !== draft.title ||
      saved.status !== draft.status ||
      saved.effectiveDate !== draft.effectiveDate ||
      saved.metaTitle !== draft.metaTitle ||
      saved.metaDescription !== draft.metaDescription ||
      saved.openGraphImage !== draft.openGraphImage ||
      JSON.stringify(saved.blocks) !== JSON.stringify(draft.blocks)
    );
  }, [draft, saved]);

  const canRemove = draft.blocks.length > 1;

  const updateBlock = (index: number, next: ContentBlock) => {
    setDraft((d) => {
      const blocks = [...d.blocks];
      blocks[index] = next;
      return { ...d, blocks };
    });
  };

  const removeBlock = (index: number) => {
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((_, i) => i !== index) }));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setDraft((d) => {
      const target = index + direction;
      if (target < 0 || target >= d.blocks.length) return d;
      const blocks = [...d.blocks];
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...d, blocks };
    });
  };

  const addBlock = (type: ContentBlockType) => {
    const make = NEW_BLOCK_TEMPLATES[type];
    if (!make) return;
    setDraft((d) => ({ ...d, blocks: [...d.blocks, make()] }));
  };

  const loadRevisions = useCallback(async () => {
    setRevisionsLoading(true);
    try {
      setRevisions(await fetchContentPageRevisions(slug, locale));
    } catch (error) {
      toast.error(getErrorMessage(error, t("revisionsFailed")));
    } finally {
      setRevisionsLoading(false);
    }
  }, [slug, locale, t]);

  const handleRestore = async (revisionId: string) => {
    setRestoring(true);
    try {
      const restored = await restoreContentPageRevision(slug, locale, revisionId);
      setDraft({
        title: restored.title,
        blocks: restored.blocks,
        status: restored.status,
        effectiveDate: restored.effectiveDate ?? "",
        metaTitle: restored.metaTitle ?? "",
        metaDescription: restored.metaDescription ?? "",
        openGraphImage: restored.openGraphImage ?? "",
      });
      setSaved({
        title: restored.title,
        blocks: restored.blocks,
        status: restored.status,
        effectiveDate: restored.effectiveDate ?? "",
        metaTitle: restored.metaTitle ?? "",
        metaDescription: restored.metaDescription ?? "",
        openGraphImage: restored.openGraphImage ?? "",
      });
      onSaved(restored);
      await loadRevisions();
      toast.success(t("restoreToast"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("restoreFailed")));
    } finally {
      setRestoring(false);
      setConfirmRestoreId(null);
    }
  };

  const handleSave = async (status?: "draft" | "published") => {
    const nextStatus = status ?? draft.status;
    const blocks = draft.blocks.filter((b) => {
      if (b.type === "bullets" || b.type === "steps") return b.items.some((i) => i.trim());
      if (b.type === "table") return b.columns.some((c) => c.trim());
      if (b.type === "coreValues") return b.values.some((v) => v.title.trim() || v.description.trim());
      if (b.type === "milestones") return b.items.some((i) => i.title.trim() || i.description.trim());
      if (b.type === "prose" || b.type === "callout") return b.body.trim().length > 0;
      if (b.type === "hero") return b.title.trim().length > 0;
      if (b.type === "statsBand") return b.stats.some((s) => s.value.trim() && s.label.trim());
      if (b.type === "ctaBand") return b.ctaLabel.trim().length > 0 && b.ctaHref.trim().length > 0;
      if (b.type === "image") return b.src.trim().length > 0 && b.alt.trim().length > 0;
      return true;
    });

    if (!draft.title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    setSaving(true);
    try {
      const savedPage = await saveContentPage({
        slug,
        locale,
        title: draft.title.trim(),
        blocks,
        status: nextStatus,
        effectiveDate: draft.effectiveDate.trim() || null,
        metaTitle: draft.metaTitle.trim() || null,
        metaDescription: draft.metaDescription.trim() || null,
        openGraphImage: draft.openGraphImage.trim() || null,
      });
      setDraft({
        title: savedPage.title,
        blocks: savedPage.blocks,
        status: savedPage.status,
        effectiveDate: savedPage.effectiveDate ?? "",
        metaTitle: savedPage.metaTitle ?? "",
        metaDescription: savedPage.metaDescription ?? "",
        openGraphImage: savedPage.openGraphImage ?? "",
      });
      setSaved({
        title: savedPage.title,
        blocks: savedPage.blocks,
        status: savedPage.status,
        effectiveDate: savedPage.effectiveDate ?? "",
        metaTitle: savedPage.metaTitle ?? "",
        metaDescription: savedPage.metaDescription ?? "",
        openGraphImage: savedPage.openGraphImage ?? "",
      });
      onSaved(savedPage);
      setConfirmPublish(false);
      if (revisions.length > 0) loadRevisions();
      toast.success(savedPage.status === "published" ? t("publishedToast") : t("draftToast"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromEnglish = async () => {
    if (locale === "en") return;
    const translated = allPages.find((p) => p.slug === slug && p.locale === locale);
    if (translated?.status === "published") {
      const ok = window.confirm(t("copyOverwriteConfirm"));
      if (!ok) return;
    }
    setSaving(true);
    try {
      const copied = await copyContentPage(slug, "en", locale);
      setDraft({
        title: copied.title,
        blocks: copied.blocks,
        status: copied.status,
        effectiveDate: copied.effectiveDate ?? "",
        metaTitle: copied.metaTitle ?? "",
        metaDescription: copied.metaDescription ?? "",
        openGraphImage: copied.openGraphImage ?? "",
      });
      setSaved({
        title: copied.title,
        blocks: copied.blocks,
        status: copied.status,
        effectiveDate: copied.effectiveDate ?? "",
        metaTitle: copied.metaTitle ?? "",
        metaDescription: copied.metaDescription ?? "",
        openGraphImage: copied.openGraphImage ?? "",
      });
      onSaved(copied);
      toast.success(t("copyToast"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("copyFailed")));
    } finally {
      setSaving(false);
    }
  };

  const [loadingBlueprint, setLoadingBlueprint] = useState(false);

  const handleLoadBlueprint = async () => {
    if (draft.blocks.length > 0 && !window.confirm("Loading the blueprint will replace your current blocks in this draft. Continue?")) {
      return;
    }
    setLoadingBlueprint(true);
    try {
      const blueprint = await fetchContentBlueprint(slug, locale);
      if (blueprint) {
        setDraft((d) => ({
          ...d,
          title: blueprint.title || d.title,
          blocks: blueprint.blocks || [],
        }));
        toast.success(`Loaded standard ${slug} blueprint with ${blueprint.blocks.length} sections! Click Save Draft or Publish.`);
      } else {
        toast.error("No blueprint found for this page.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load blueprint"));
    } finally {
      setLoadingBlueprint(false);
    }
  };

  const handleDelete = async () => {
    if (!page) return;
    if (!window.confirm(t("deleteConfirm"))) return;
    setSaving(true);
    try {
      await deleteContentPage(slug, locale);
      onDeleted(slug, locale);
      setDraft(EMPTY_DRAFT);
      setSaved(null);
      toast.success(t("deleteToast"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("deleteFailed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!page && (
        <Alert className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <FileText className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{t("neverWrittenTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("neverWrittenBody")}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={loadingBlueprint}
            onClick={handleLoadBlueprint}
            className="shrink-0 text-xs h-8 font-semibold shadow-xs"
          >
            {loadingBlueprint ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            Load Standard Blueprint
          </Button>
        </Alert>
      )}

      {page?.status === "published" && isDirty && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">{t("unpublishedChanges")}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground">{t("detailsTitle")}</CardTitle>
          <CardDescription>{t("detailsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="content-title" className="text-xs">
              {t("pageTitle")}
            </Label>
            <Input
              id="content-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder={t("pageTitlePlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content-effective" className="text-xs">
              {t("effectiveDate")}
            </Label>
            <Input
              id="content-effective"
              value={draft.effectiveDate}
              onChange={(e) => setDraft((d) => ({ ...d, effectiveDate: e.target.value }))}
              placeholder={t("effectiveDatePlaceholder")}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground">{t("seoTitle")}</CardTitle>
          <CardDescription>{t("seoDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="content-meta-title" className="text-xs">
              {t("seoMetaTitle")}
            </Label>
            <Input
              id="content-meta-title"
              value={draft.metaTitle}
              maxLength={200}
              onChange={(e) => setDraft((d) => ({ ...d, metaTitle: e.target.value }))}
              placeholder={t("seoMetaTitlePlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content-meta-desc" className="text-xs">
              {t("seoMetaDesc")}
            </Label>
            <textarea
              id="content-meta-desc"
              rows={3}
              maxLength={320}
              value={draft.metaDescription}
              onChange={(e) => setDraft((d) => ({ ...d, metaDescription: e.target.value }))}
              placeholder={t("seoMetaDescPlaceholder")}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <p className="text-right text-[11px] font-mono text-muted-foreground">
              {draft.metaDescription.length} / 320
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content-og-image" className="text-xs">
              {t("seoOgImage")}
            </Label>
            <Input
              id="content-og-image"
              value={draft.openGraphImage}
              maxLength={500}
              onChange={(e) => setDraft((d) => ({ ...d, openGraphImage: e.target.value }))}
              placeholder={t("seoOgImagePlaceholder")}
              className="font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-foreground">{t("revisionsTitle")}</CardTitle>
            <CardDescription>{t("revisionsDescription")}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a href={previewHref} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Eye className="mr-1.5 h-3.5 w-3.5" /> {t("preview")}
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={loadRevisions} disabled={revisionsLoading}>
              <History className="mr-1.5 h-3.5 w-3.5" /> {t("refresh")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {revisionsLoading ? (
            <SkeletonList count={3} itemClassName="h-14 rounded-lg" />
          ) : revisions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              {t("revisionsEmpty")}
            </p>
          ) : (
            revisions.map((revision) => (
              <div
                key={revision.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge
                      tone={revision.status === "published" ? "success" : "neutral"}
                    >
                      {revision.status === "published" ? t("live") : t("draft")}
                    </StatusBadge>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t(`change_${revision.changeType.toLowerCase()}` as never)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {formatRevisionTime(revision.createdAt, locale)}
                    {revision.authorEmail ? ` · ${revision.authorEmail}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setConfirmRestoreId(revision.id)}
                  disabled={restoring}
                >
                  {t("restore")}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Blocks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground">{t("blocksTitle")}</CardTitle>
          <CardDescription>{t("blocksDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.blocks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              {t("noBlocks")}
            </p>
          ) : (
            draft.blocks.map((block, index) => (
              <BlockCard
                key={block.id}
                block={block}
                index={index}
                total={draft.blocks.length}
                canRemove={canRemove}
                onChange={(next) => updateBlock(index, next)}
                onRemove={() => removeBlock(index)}
                onMove={(dir) => moveBlock(index, dir)}
              />
            ))
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Select value={newBlockType} onValueChange={(v) => setNewBlockType(v as ContentBlockType)}>
              <SelectTrigger className="h-9 w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`block_${type}` as never)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => addBlock(newBlockType)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("addBlock")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={handleLoadBlueprint}
          disabled={saving || loadingBlueprint}
          title="Load official standard blueprint for this page"
        >
          {loadingBlueprint ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
          )}
          Load Blueprint
        </Button>
        {locale !== "en" && (
          <Button variant="outline" onClick={handleCopyFromEnglish} disabled={saving}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> {t("copyFromEnglish")}
          </Button>
        )}
        <Button onClick={() => handleSave("draft")} disabled={saving || !isDirty}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t("saveDraft")}
        </Button>
        <Button variant="outline" onClick={() => setConfirmPublish(true)} disabled={saving}>
          {t("publish")}
        </Button>
        {page && (
          <Button
            variant="ghost"
            className="ml-auto text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={saving}
          >
            <Trash2 className="mr-2 h-4 w-4" /> {t("deletePage")}
          </Button>
        )}
      </div>

      {/* Publish approval gate — publishing is the point of no immediate return,
          so the admin confirms the intent and the save records a PUBLISH snapshot. */}
      <Dialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("publishConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("publishConfirmBody")}</DialogDescription>
          </DialogHeader>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{t("publishConfirmWarn")}</AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmPublish(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button onClick={() => handleSave("published")} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("publish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore confirmation — restores a prior snapshot and snapshots the rollback. */}
      <Dialog
        open={confirmRestoreId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmRestoreId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("restoreConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("restoreConfirmBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmRestoreId(null)}
              disabled={restoring}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => confirmRestoreId && handleRestore(confirmRestoreId)}
              disabled={restoring || !confirmRestoreId}
            >
              {restoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("restore")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const STORAGE_KEY_CONTENT_SLUG = "myjudicial_admin_content_slug";
const STORAGE_KEY_CONTENT_LOCALE = "myjudicial_admin_content_locale";

function getInitialContentSlug(
  searchParam: string | null | undefined,
  activeSlugs: readonly ContentPageSlug[],
  defaultSlug?: ContentPageSlug
): ContentPageSlug {
  const paramUpper = searchParam?.toUpperCase() as ContentPageSlug | undefined;
  if (paramUpper && activeSlugs.includes(paramUpper)) {
    return paramUpper;
  }
  if (defaultSlug && activeSlugs.includes(defaultSlug)) {
    return defaultSlug;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONTENT_SLUG)?.toUpperCase() as ContentPageSlug | undefined;
      if (stored && activeSlugs.includes(stored)) {
        return stored;
      }
    } catch {}
  }
  return activeSlugs[0] ?? "ABOUT";
}

function getInitialContentLocale(searchParam: string | null | undefined): ContentLocale {
  const paramLower = searchParam?.toLowerCase() as ContentLocale | undefined;
  if (paramLower && CONTENT_LOCALES.includes(paramLower)) {
    return paramLower;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONTENT_LOCALE)?.toLowerCase() as ContentLocale | undefined;
      if (stored && CONTENT_LOCALES.includes(stored)) {
        return stored;
      }
    } catch {}
  }
  return "en";
}

export interface ContentEditorProps {
  embedded?: boolean;
  allowedSlugs?: ContentPageSlug[];
  defaultSlug?: ContentPageSlug;
}

export function ContentEditor({
  embedded = false,
  allowedSlugs,
  defaultSlug,
}: ContentEditorProps = {}) {
  const t = useTranslations("adminContent");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeSlugs = allowedSlugs ?? SLUG_ORDER;
  const slugFromQuery = searchParams?.get("slug");
  const localeFromQuery = searchParams?.get("locale");

  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<ContentPageSlug>(() =>
    getInitialContentSlug(slugFromQuery, activeSlugs, defaultSlug)
  );
  const [locale, setLocale] = useState<ContentLocale>(() =>
    getInitialContentLocale(localeFromQuery)
  );
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [allowedBlocks, setAllowedBlocks] = useState<Record<string, readonly ContentBlockType[]>>({});

  // Synchronize slug and locale across refreshes, deep-links, and client navigation
  useEffect(() => {
    if (!embedded && searchParams) {
      const sParam = searchParams.get("slug")?.toUpperCase() as ContentPageSlug | undefined;
      const lParam = searchParams.get("locale")?.toLowerCase() as ContentLocale | undefined;

      let changed = false;
      const params = new URLSearchParams(searchParams.toString());

      if (sParam && activeSlugs.includes(sParam)) {
        if (sParam !== slug) setSlug(sParam);
        try {
          localStorage.setItem(STORAGE_KEY_CONTENT_SLUG, sParam.toLowerCase());
        } catch {}
      } else if (!sParam) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY_CONTENT_SLUG)?.toUpperCase() as ContentPageSlug | undefined;
          const target = stored && activeSlugs.includes(stored) ? stored : slug;
          if (target !== slug) setSlug(target);
          params.set("slug", target.toLowerCase());
          changed = true;
        } catch {}
      }

      if (lParam && CONTENT_LOCALES.includes(lParam)) {
        if (lParam !== locale) setLocale(lParam);
        try {
          localStorage.setItem(STORAGE_KEY_CONTENT_LOCALE, lParam);
        } catch {}
      } else if (!lParam) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY_CONTENT_LOCALE)?.toLowerCase() as ContentLocale | undefined;
          const target = stored && CONTENT_LOCALES.includes(stored) ? stored : locale;
          if (target !== locale) setLocale(target);
          params.set("locale", target);
          changed = true;
        } catch {}
      }

      if (changed) {
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    }
  }, [embedded, searchParams, pathname, router, activeSlugs, slug, locale]);

  const handleSelectSlug = (s: ContentPageSlug) => {
    setSlug(s);
    try {
      localStorage.setItem(STORAGE_KEY_CONTENT_SLUG, s.toLowerCase());
    } catch {}
    if (!embedded && searchParams) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("slug", s.toLowerCase());
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  };

  const handleSelectLocale = (l: ContentLocale) => {
    setLocale(l);
    try {
      localStorage.setItem(STORAGE_KEY_CONTENT_LOCALE, l.toLowerCase());
    } catch {}
    if (!embedded && searchParams) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("locale", l.toLowerCase());
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [schema, list] = await Promise.all([fetchContentSchema(), fetchAdminContentPages()]);
      setAllowedBlocks(schema.allowedBlocks);
      setPages(list);
    } catch (error) {
      toast.error(getErrorMessage(error, t("loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const onSaved = useCallback((page: ContentPage) => {
    setPages((prev) => {
      const rest = prev.filter((p) => !(p.slug === page.slug && p.locale === page.locale));
      return [...rest, page];
    });
  }, []);

  const onDeleted = useCallback((slug: ContentPageSlug, locale: ContentLocale) => {
    setPages((prev) => prev.filter((p) => !(p.slug === slug && p.locale === locale)));
  }, []);

  if (loading) {
    return (
      <div className={embedded ? "w-full py-4" : "space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 max-w-7xl mx-auto min-w-0"}>
        <FormSectionSkeleton fields={4} />
      </div>
    );
  }

  // Status badge and copy source are handled inside PageEditor; the parent
  // only owns page/locale selection and the loaded list.
  const existing = pages.find((p) => p.slug === slug && p.locale === locale);
  const allowed = allowedBlocks[slug] ?? ["prose"];

  return (
    <div className={embedded ? "space-y-6 w-full" : "space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 max-w-7xl mx-auto min-w-0"}>
      {/* Page tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted p-0.5">
        {activeSlugs.map((s) => {
          const active = s === slug;
          return (
            <button
              key={s}
              type="button"
              onClick={() => handleSelectSlug(s)}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`page_${s.toLowerCase()}` as never)}
            </button>
          );
        })}
      </div>

      {/* Locale tabs with per-locale publish state */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
        {CONTENT_LOCALES.map((l) => {
          const active = l === locale;
          const page = pages.find((p) => p.slug === slug && p.locale === l);
          return (
            <button
              key={l}
              type="button"
              onClick={() => handleSelectLocale(l)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.toUpperCase()}
              {page ? (
                page.status === "published" ? (
                  <Check className="h-3 w-3 text-primary" aria-hidden />
                ) : (
                  <FileText className="h-3 w-3 text-muted-foreground" aria-hidden />
                )
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" aria-hidden />
              )}
            </button>
          );
        })}

        <div className="flex items-center gap-2 px-1">
          {existing ? (
            <StatusBadge tone={existing.status === "published" ? "success" : "pending"}>
              {existing.status === "published" ? t("live") : t("draft")}
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral">{t("neverWritten")}</StatusBadge>
          )}
        </div>
      </div>

      {/* Keyed by slug:locale so the draft buffer resets on page switch. */}
      <PageEditor
        key={`${slug}:${locale}`}
        slug={slug}
        locale={locale}
        allowedTypes={allowed}
        page={existing}
        allPages={pages}
        onSaved={onSaved}
        onDeleted={onDeleted}
      />
    </div>
  );
}