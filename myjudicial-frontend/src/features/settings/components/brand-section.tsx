"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
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
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.platformTagline !== saved.platformTagline ||
    draft.copyrightNotice !== saved.copyrightNotice;

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
      icon={Sparkles}
      title={t("brandIdentityTitle")}
      description={t("brandIdentityDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
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
          />
          <p className="text-[11px] text-muted-foreground">{t("copyrightNoticeDesc")}</p>
        </div>
      </div>
    </SettingsSection>
  );
}