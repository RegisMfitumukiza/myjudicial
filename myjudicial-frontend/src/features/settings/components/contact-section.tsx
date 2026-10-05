"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
import type { SettingsData } from "../settings";

interface Props {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

export function ContactChannelsSection({ settings, onSaved }: Props) {
  const t = useTranslations("admin.settings");
  const [saved, setSaved] = useState({
    supportEmail: settings.supportEmail,
    hotlinePhone: settings.hotlinePhone,
    whatsappNumber: settings.whatsappNumber,
    supportWorkingHours: settings.supportWorkingHours,
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.supportEmail !== saved.supportEmail ||
    draft.hotlinePhone !== saved.hotlinePhone ||
    draft.whatsappNumber !== saved.whatsappNumber ||
    draft.supportWorkingHours !== saved.supportWorkingHours;

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
      icon={Mail}
      title={t("companyDetailsTitle")}
      description={t("companyDetailsDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="settings-support-email" className="text-xs font-semibold">
            {t("supportEmail")}
          </Label>
          <Input
            id="settings-support-email"
            type="email"
            value={draft.supportEmail}
            onChange={(e) => set("supportEmail", e.target.value)}
            placeholder="support@myjudicial.com"
          />
          <p className="text-[11px] text-muted-foreground">{t("supportEmailDesc")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-hotline-phone" className="text-xs font-semibold">
            {t("hotlinePhone")}
          </Label>
          <Input
            id="settings-hotline-phone"
            value={draft.hotlinePhone}
            onChange={(e) => set("hotlinePhone", e.target.value)}
            placeholder="+250 788 312 456"
          />
          <p className="text-[11px] text-muted-foreground">{t("hotlinePhoneDesc")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-whatsapp-number" className="text-xs font-semibold">
            {t("whatsappNumber")}
          </Label>
          <Input
            id="settings-whatsapp-number"
            value={draft.whatsappNumber}
            onChange={(e) => set("whatsappNumber", e.target.value)}
            placeholder="+250 788 312 456"
          />
          <p className="text-[11px] text-muted-foreground">{t("whatsappNumberDesc")}</p>
        </div>

        <div className="space-y-1.5 sm:col-span-3">
          <Label htmlFor="settings-support-hours" className="text-xs font-semibold">
            {t("supportHours")}
          </Label>
          <Input
            id="settings-support-hours"
            value={draft.supportWorkingHours}
            onChange={(e) => set("supportWorkingHours", e.target.value)}
            placeholder="Monday – Friday: 8:00 AM – 6:00 PM CAT"
          />
          <p className="text-[11px] text-muted-foreground">{t("supportHoursDesc")}</p>
        </div>
      </div>
    </SettingsSection>
  );
}