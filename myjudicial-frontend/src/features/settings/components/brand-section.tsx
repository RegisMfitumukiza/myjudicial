"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Sparkles, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
import { uploadContentImage } from "@/lib/api/upload";
import type { SettingsData } from "../settings";

interface Props {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

export function BrandIdentitySection({ settings, onSaved }: Props) {
  const t = useTranslations("admin.settings");
  const [saved, setSaved] = useState({
    platformTagline: settings.platformTagline,
    copyrightNotice: settings.copyrightNotice,
    brandLogoUrl: settings.brandLogoUrl || "",
    brandFaviconUrl: settings.brandFaviconUrl || "",
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const dirty =
    draft.platformTagline !== saved.platformTagline ||
    draft.copyrightNotice !== saved.copyrightNotice ||
    draft.brandLogoUrl !== saved.brandLogoUrl ||
    draft.brandFaviconUrl !== saved.brandFaviconUrl;

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const result = await uploadContentImage(file);
      set("brandLogoUrl", result.url);
      toast.success("Logo uploaded successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const result = await uploadContentImage(file);
      set("brandFaviconUrl", result.url);
      toast.success("Favicon uploaded successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload favicon");
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    }
  };

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
      icon={Sparkles}
      title={t("brandIdentityTitle")}
      description={t("brandIdentityDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="settings-tagline" className="text-xs font-semibold">
              {t("platformTagline")}
            </Label>
            <Input
              id="settings-tagline"
              value={draft.platformTagline}
              onChange={(e) => set("platformTagline", e.target.value)}
              placeholder="Democratizing Access to Justice Across Rwanda"
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">{t("platformTaglineDesc")}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-copyright" className="text-xs font-semibold">
              {t("copyrightNotice")}
            </Label>
            <Input
              id="settings-copyright"
              value={draft.copyrightNotice}
              onChange={(e) => set("copyrightNotice", e.target.value)}
              placeholder="© 2026 MyJudicial Ltd. All rights reserved."
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">{t("copyrightNoticeDesc")}</p>
          </div>
        </div>

        {/* ── Brand Media Assets (Logo & Favicon) ── */}
        <div className="pt-2 border-t border-border/60">
          <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-primary" />
            Brand Visual Assets
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Platform Logo */}
            <div className="space-y-2 p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Platform Logo</Label>
                <span className="text-[10px] text-muted-foreground">Nav, Header, & Footer</span>
              </div>
              {draft.brandLogoUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-28 rounded-lg border border-border bg-background p-1.5 flex items-center justify-center overflow-hidden">
                      <img src={draft.brandLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => set("brandLogoUrl", "")}
                      className="text-xs text-destructive hover:bg-destructive/10 h-8"
                    >
                      Remove
                    </Button>
                  </div>

                  {/* Dual-Theme Contrast Checker */}
                  <div className="rounded-lg border border-border/70 bg-background/50 p-2.5 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Theme Contrast Legibility
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-md border border-slate-200 bg-white p-2 flex flex-col items-center justify-center gap-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Light Theme</span>
                        <div className="h-7 w-full flex items-center justify-center">
                          <img src={draft.brandLogoUrl} alt="Light theme" className="max-h-full max-w-full object-contain" />
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-800 bg-slate-950 p-2 flex flex-col items-center justify-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Dark Theme</span>
                        <div className="h-7 w-full flex items-center justify-center">
                          <img src={draft.brandLogoUrl} alt="Dark theme" className="max-h-full max-w-full object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="text-xs h-8"
                >
                  {uploadingLogo ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Upload Logo
                </Button>
                <Input
                  value={draft.brandLogoUrl}
                  onChange={(e) => set("brandLogoUrl", e.target.value)}
                  placeholder="Or paste image URL"
                  className="text-xs h-8 flex-1"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Recommended: Transparent SVG or PNG (240x60px).</p>
            </div>

            {/* Platform Favicon */}
            <div className="space-y-2 p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Platform Favicon</Label>
                <span className="text-[10px] text-muted-foreground">Browser Tab & Bookmarks</span>
              </div>
              {draft.brandFaviconUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg border border-border bg-background p-1.5 flex items-center justify-center overflow-hidden">
                      <img src={draft.brandFaviconUrl} alt="Favicon" className="max-h-full max-w-full object-contain" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => set("brandFaviconUrl", "")}
                      className="text-xs text-destructive hover:bg-destructive/10 h-8"
                    >
                      Remove
                    </Button>
                  </div>

                  {/* Browser Tab Emulator */}
                  <div className="rounded-lg border border-border/70 bg-background/50 p-2.5 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Browser Tab Emulator
                    </span>
                    <div className="flex items-center gap-2 max-w-[240px] px-2.5 py-1.5 rounded-t-md border-t border-x border-border bg-card shadow-2xs text-xs font-medium text-foreground">
                      <img src={draft.brandFaviconUrl} alt="Favicon Tab" className="h-3.5 w-3.5 object-contain rounded-xs shrink-0" />
                      <span className="truncate text-[11px]">{settings.platformName || "MyJudicial"} | Legal</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  className="hidden"
                  onChange={handleFaviconUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingFavicon}
                  onClick={() => faviconInputRef.current?.click()}
                  className="text-xs h-8"
                >
                  {uploadingFavicon ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Upload Favicon
                </Button>
                <Input
                  value={draft.brandFaviconUrl}
                  onChange={(e) => set("brandFaviconUrl", e.target.value)}
                  placeholder="Or paste favicon URL"
                  className="text-xs h-8 flex-1"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Recommended: 32x32px or 64x64px square icon.</p>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
