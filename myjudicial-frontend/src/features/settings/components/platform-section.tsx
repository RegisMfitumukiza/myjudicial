"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Cog } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
import type { SettingsData } from "../settings";

interface Props {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

export function PlatformOperationsSection({ settings, onSaved }: Props) {
  const t = useTranslations("admin.settings");
  const [saved, setSaved] = useState({
    platformName: settings.platformName,
    defaultRole: settings.defaultRole,
    platformFeePercent: settings.platformFeePercent,
    minEscrowDurationSeconds: settings.minEscrowDurationSeconds,
    paymentMode: settings.paymentMode,
    airtelEnabled: settings.airtelEnabled,
    maintenanceMode: settings.maintenanceMode,
    maintenanceNotice: settings.maintenanceNotice,
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.platformName !== saved.platformName ||
    draft.defaultRole !== saved.defaultRole ||
    draft.platformFeePercent !== saved.platformFeePercent ||
    draft.minEscrowDurationSeconds !== saved.minEscrowDurationSeconds ||
    draft.paymentMode !== saved.paymentMode ||
    draft.airtelEnabled !== saved.airtelEnabled ||
    draft.maintenanceMode !== saved.maintenanceMode ||
    draft.maintenanceNotice !== saved.maintenanceNotice;

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
      icon={Cog}
      title={t("platformOpsTitle")}
      description={t("platformOpsDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="settings-platform-name" className="text-xs font-semibold">{t("platformName")}</Label>
          <Input
            id="settings-platform-name"
            value={draft.platformName}
            onChange={(e) => set("platformName", e.target.value)}
            className="w-full"
          />
          <p className="text-[11px] text-muted-foreground">{t("platformNameDesc")}</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("defaultUserRole")}</Label>
          <Select value={draft.defaultRole} onValueChange={(v) => set("defaultRole", v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CITIZEN">{t("citizen")}</SelectItem>
              <SelectItem value="EXPERT">{t("expert")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">{t("defaultUserRoleDesc")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-platform-fee" className="text-xs font-semibold">{t("platformFee")}</Label>
          <Input
            id="settings-platform-fee"
            type="number"
            min={0}
            max={100}
            value={draft.platformFeePercent}
            onChange={(e) => set("platformFeePercent", Number(e.target.value))}
            className="w-full"
          />
          <p className="text-[11px] text-muted-foreground">{t("platformFeeDesc")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-min-escrow" className="text-xs font-semibold">{t("minEscrowDuration")}</Label>
          <Input
            id="settings-min-escrow"
            type="number"
            min={0}
            value={draft.minEscrowDurationSeconds}
            onChange={(e) => set("minEscrowDurationSeconds", Number(e.target.value))}
            className="w-full"
          />
          <p className="text-[11px] text-muted-foreground">{t("minEscrowDurationDesc")}</p>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs font-semibold">{t("paymentMode")}</Label>
          <Select
            value={draft.paymentMode}
            onValueChange={(v) => set("paymentMode", v as SettingsData["paymentMode"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PAYMENT_REQUIRED">{t("paymentRequired")}</SelectItem>
              <SelectItem value="BOOKING_FIRST">{t("bookingFirst")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">{t("paymentModeDesc")}</p>
        </div>

        {/* Airtel Money Toggle */}
        <div className="sm:col-span-2 rounded-xl border border-border bg-muted/20 p-4 sm:p-5 space-y-1">
          <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-3">
            <div>
              <Label className="text-sm font-semibold">{t("airtelEnabled")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t("airtelEnabledDesc")}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Switch
                checked={draft.airtelEnabled}
                onCheckedChange={(v) => set("airtelEnabled", v)}
              />
              <span className={`text-xs sm:text-sm font-medium ${draft.airtelEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                {draft.airtelEnabled ? t("airtelEnabledOn") : t("airtelEnabledOff")}
              </span>
            </div>
          </div>
        </div>

        {/* Maintenance Mode Callout */}
        <div className="sm:col-span-2 rounded-xl border border-border bg-muted/20 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-3">
            <div>
              <Label className="text-sm font-semibold">{t("maintenanceMode")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t("maintenanceModeDesc")}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Switch
                checked={draft.maintenanceMode}
                onCheckedChange={(v) => set("maintenanceMode", v)}
              />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {draft.maintenanceMode ? t("enabled") : t("disabled")}
              </span>
            </div>
          </div>
          <div className="space-y-1.5 pt-3 border-t border-border/60">
            <Label htmlFor="settings-maintenance-notice" className="text-xs font-semibold">
              {t("maintenanceNotice")}
            </Label>
            <Input
              id="settings-maintenance-notice"
              value={draft.maintenanceNotice}
              onChange={(e) => set("maintenanceNotice", e.target.value)}
              placeholder="e.g. Scheduled platform upgrade Sunday at 02:00 AM CAT. Video consultations remain operational."
            />
            <p className="text-[11px] text-muted-foreground">{t("maintenanceNoticeDesc")}</p>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}