"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Building2 } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
import type { SettingsData } from "../settings";

interface Props {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

export function HeadquartersSection({ settings, onSaved }: Props) {
  const t = useTranslations("admin.settings");
  const [saved, setSaved] = useState({
    officeBuilding: settings.officeBuilding,
    officeStreet: settings.officeStreet,
    officeDistrict: settings.officeDistrict,
    officePoBox: settings.officePoBox,
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.officeBuilding !== saved.officeBuilding ||
    draft.officeStreet !== saved.officeStreet ||
    draft.officeDistrict !== saved.officeDistrict ||
    draft.officePoBox !== saved.officePoBox;

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
      icon={Building2}
      title={t("officeTitle")}
      description={t("officeDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="settings-office-building" className="text-xs font-semibold">
            {t("officeBuilding")}
          </Label>
          <Input
            id="settings-office-building"
            value={draft.officeBuilding}
            onChange={(e) => set("officeBuilding", e.target.value)}
            placeholder="Centenary House, 4th Floor"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-office-street" className="text-xs font-semibold">
            {t("officeStreet")}
          </Label>
          <Input
            id="settings-office-street"
            value={draft.officeStreet}
            onChange={(e) => set("officeStreet", e.target.value)}
            placeholder="KN 3 Ave & KN 4 St"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-office-district" className="text-xs font-semibold">
            {t("officeDistrict")}
          </Label>
          <Input
            id="settings-office-district"
            value={draft.officeDistrict}
            onChange={(e) => set("officeDistrict", e.target.value)}
            placeholder="Nyarugenge CBD, Kigali, Rwanda"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-office-pobox" className="text-xs font-semibold">
            {t("officePoBox")}
          </Label>
          <Input
            id="settings-office-pobox"
            value={draft.officePoBox}
            onChange={(e) => set("officePoBox", e.target.value)}
            placeholder="P.O. Box 2848, Kigali"
          />
        </div>
      </div>
    </SettingsSection>
  );
}