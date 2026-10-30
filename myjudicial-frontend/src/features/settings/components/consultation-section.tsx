"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Clock, ShieldCheck } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
import type { SettingsData } from "../settings";

function formatHours(hours: number): string {
  if (!hours || hours <= 0) return "0 hours (instant / no grace)";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""}`;
  const days = (hours / 24).toFixed(1).replace(/\.0$/, "");
  return `${days} day${Number(days) > 1 ? "s" : ""} (${hours} hrs)`;
}

const ADVANCE_PRESETS = [1, 2, 6, 24];
const CANCELLATION_PRESETS = [2, 12, 24, 48];

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
          <div className="flex items-center justify-between">
            <Label htmlFor="settings-min-notice" className="text-xs font-semibold">
              {t("minAdvanceBookingHours")}
            </Label>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium flex items-center gap-1">
              <Clock size={10} />
              {formatHours(draft.minAdvanceBookingHours)}
            </Badge>
          </div>
          <Input
            id="settings-min-notice"
            type="number"
            min={0}
            max={168}
            value={draft.minAdvanceBookingHours}
            onChange={(e) => set("minAdvanceBookingHours", Number(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>{t("minAdvanceBookingHoursDesc")}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px]">Presets:</span>
              {ADVANCE_PRESETS.map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => set("minAdvanceBookingHours", hrs)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    draft.minAdvanceBookingHours === hrs
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {hrs}h
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="settings-cancellation-grace" className="text-xs font-semibold">
              {t("cancellationGraceHours")}
            </Label>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium flex items-center gap-1">
              <ShieldCheck size={10} />
              {formatHours(draft.cancellationGraceHours)}
            </Badge>
          </div>
          <Input
            id="settings-cancellation-grace"
            type="number"
            min={0}
            max={168}
            value={draft.cancellationGraceHours}
            onChange={(e) => set("cancellationGraceHours", Number(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>{t("cancellationGraceHoursDesc")}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px]">Presets:</span>
              {CANCELLATION_PRESETS.map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => set("cancellationGraceHours", hrs)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    draft.cancellationGraceHours === hrs
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {hrs}h
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}