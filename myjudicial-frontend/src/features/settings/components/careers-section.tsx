"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Briefcase } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
import type { CareersHiringStatus, SettingsData } from "../settings";

interface Props {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

export function CareersSection({ settings, onSaved }: Props) {
  const t = useTranslations("admin.settings");
  const [saved, setSaved] = useState({
    careersEmail: settings.careersEmail,
    careersHiringStatus: settings.careersHiringStatus,
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.careersEmail !== saved.careersEmail ||
    draft.careersHiringStatus !== saved.careersHiringStatus;

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
      icon={Briefcase}
      title={t("careersTitle")}
      description={t("careersDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="settings-careers-email" className="text-xs font-semibold">
            {t("careersEmail")}
          </Label>
          <Input
            id="settings-careers-email"
            type="email"
            value={draft.careersEmail}
            onChange={(e) => set("careersEmail", e.target.value)}
            placeholder="support@myjudicial.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-careers-status" className="text-xs font-semibold">
            {t("hiringStatus")}
          </Label>
          <Select
            value={draft.careersHiringStatus}
            onValueChange={(val) => set("careersHiringStatus", val as CareersHiringStatus)}
          >
            <SelectTrigger id="settings-careers-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVELY_HIRING">{t("hiringActive")}</SelectItem>
              <SelectItem value="TALENT_POOL">{t("hiringTalentPool")}</SelectItem>
              <SelectItem value="PAUSED">{t("hiringPaused")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        {t.rich("careersRolesManaged", {
          link: (chunks) => (
            <Link href="/admin/dashboard/settings?tab=careers" className="font-semibold text-foreground underline underline-offset-2 hover:opacity-80">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </SettingsSection>
  );
}