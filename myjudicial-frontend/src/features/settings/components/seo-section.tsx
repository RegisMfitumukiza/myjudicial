"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Globe, Eye, Upload, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { uploadContentImage } from "@/lib/api/upload";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
import type { SettingsData } from "../settings";

interface Props {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

export function SeoSettingsSection({ settings, onSaved }: Props) {
  const t = useTranslations("admin.settings");
  const [saved, setSaved] = useState({
    ogImageUrl: settings.ogImageUrl,
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    seoKeywords: settings.seoKeywords,
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await uploadContentImage(file);
      set("ogImageUrl", result.url);
      toast.success("Image uploaded successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const dirty =
    draft.ogImageUrl !== saved.ogImageUrl ||
    draft.seoTitle !== saved.seoTitle ||
    draft.seoDescription !== saved.seoDescription ||
    draft.seoKeywords !== saved.seoKeywords;

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await saveSettingsSection(draft);
      setSaved({ ...draft });
      onSaved(updated);
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("settingsUnavailable"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsSection
      icon={Globe}
      title={t("seoTitle")}
      description={t("seoDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Eye size={14} className="text-primary" />
              {t("livePreview")}
            </span>
            <span className="text-[11px] text-muted-foreground">
              WhatsApp • LinkedIn • Twitter / X • Facebook
            </span>
          </div>

          <div className="max-w-md mx-auto rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="relative aspect-[1200/630] w-full bg-muted flex items-center justify-center overflow-hidden">
              {draft.ogImageUrl ? (
                <img
                  src={draft.ogImageUrl}
                  alt={draft.seoTitle || settings.platformName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/og_image.png";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <Globe size={32} className="mb-2 opacity-50" />
                  <p className="text-xs">1200 × 630 Open Graph Image</p>
                </div>
              )}
            </div>
            <div className="p-3.5 space-y-1 bg-card">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                myjudicial.com
              </p>
              <p className="text-sm font-semibold text-foreground line-clamp-1 leading-snug">
                {draft.seoTitle ||
                  `${settings.platformName} | Find Verified Legal Experts in Rwanda`}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {draft.seoDescription ||
                  "Browse verified lawyers, compare fixed fees, and book legal consultations instantly."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="settings-og-image" className="text-xs font-semibold">
              {t("ogImageUrl")}
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="settings-og-image"
                value={draft.ogImageUrl}
                onChange={(e) => set("ogImageUrl", e.target.value)}
                placeholder="/og_image.png"
                className="font-mono text-xs flex-1"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-initial text-xs"
                >
                  {uploadingImage ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Upload Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set("ogImageUrl", "/og_image.png")}
                  className="flex-1 sm:flex-initial text-xs"
                >
                  Reset Default
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{t("ogImageUrlDesc")}</p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="settings-seo-title" className="text-xs font-semibold">
                {t("defaultSeoTitle")}
              </Label>
              <span
                className={`text-[10px] ${
                  draft.seoTitle.length > 60 ? "text-amber-500 font-semibold" : "text-muted-foreground"
                }`}
              >
                {draft.seoTitle.length}/60 chars
              </span>
            </div>
            <Input
              id="settings-seo-title"
              value={draft.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              placeholder="MyJudicial | Find Verified Legal Experts in Rwanda"
            />
            <p className="text-[11px] text-muted-foreground">{t("defaultSeoTitleDesc")}</p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="settings-seo-desc" className="text-xs font-semibold">
                {t("defaultSeoDesc")}
              </Label>
              <span
                className={`text-[10px] ${
                  draft.seoDescription.length > 160 ? "text-amber-500 font-semibold" : "text-muted-foreground"
                }`}
              >
                {draft.seoDescription.length}/160 chars
              </span>
            </div>
            <Textarea
              id="settings-seo-desc"
              rows={2}
              value={draft.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
              placeholder="Browse verified lawyers, compare fixed fees, and book legal consultations instantly. Rwanda's premier legal marketplace."
            />
            <p className="text-[11px] text-muted-foreground">{t("defaultSeoDescHelper")}</p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="settings-seo-keywords" className="text-xs font-semibold">
              {t("seoKeywords")}
            </Label>
            <Input
              id="settings-seo-keywords"
              value={draft.seoKeywords}
              onChange={(e) => set("seoKeywords", e.target.value)}
              placeholder="lawyer Rwanda, legal services Kigali, legal consultation, Bar certified advocates"
            />
            <p className="text-[11px] text-muted-foreground">{t("seoKeywordsDesc")}</p>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}