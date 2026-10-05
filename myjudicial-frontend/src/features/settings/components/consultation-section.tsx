"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
import type { SettingsData } from "../settings";

interface Props {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

export function ConsultationRulesSection({ settings, onSaved }: Props) {
  const t = useTranslations("admin.settings");
  const [saved, setSaved] = useState({
    minAdvanceBookingHours: settings.minAdvanceBookingHours,
    cancellationGraceHours: settings.cancellationGraceHours,
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.minAdvanceBookingHours !== saved.minAdvanceBookingHours ||
    draft.cancellationGraceHours !== saved.cancellationGraceHours;

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
      icon={Clock}
      title={t("consultationRulesTitle")}
      description={t("consultationRulesDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="settings-min-notice" className="text-xs font-semibold">
            {t("minAdvanceBookingHours")}
          </Label>
          <Input
            id="settings-min-notice"
            type="number"
            min={0}
            max={168}
            value={draft.minAdvanceBookingHours}
            onChange={(e) => set("minAdvanceBookingHours", Number(e.target.value))}
            className="w-full"
          />
          <p className="text-[11px] text-muted-foreground">{t("minAdvanceBookingHoursDesc")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-cancellation-grace" className="text-xs font-semibold">
            {t("cancellationGraceHours")}
          </Label>
          <Input
            id="settings-cancellation-grace"
            type="number"
            min={0}
            max={168}
            value={draft.cancellationGraceHours}
            onChange={(e) => set("cancellationGraceHours", Number(e.target.value))}
            className="w-full"
          />
          <p className="text-[11px] text-muted-foreground">{t("cancellationGraceHoursDesc")}</p>
        </div>
      </div>
    </SettingsSection>
  );
}