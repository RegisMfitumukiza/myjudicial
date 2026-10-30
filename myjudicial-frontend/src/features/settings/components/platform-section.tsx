"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Cog, AlertTriangle, Coins, ShieldCheck, Clock } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Badge } from "@/shared/components/ui/badge";
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

function formatEscrowDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s (immediate release)";
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (minutes < 60) {
    return remainingSecs > 0 ? `${minutes}m ${remainingSecs}s` : `${minutes} min${minutes > 1 ? "s" : ""}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours < 24) {
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  const days = (seconds / 86400).toFixed(1).replace(/\.0$/, "");
  return `${days} days (${hours} hrs)`;
}

const ESCROW_PRESETS = [
  { label: "5m", seconds: 300 },
  { label: "15m", seconds: 900 },
  { label: "1h", seconds: 3600 },
  { label: "24h", seconds: 86400 },
] as const;

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
          <div className="flex items-center justify-between">
            <Label htmlFor="settings-platform-fee" className="text-xs font-semibold">{t("platformFee")}</Label>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal text-muted-foreground">
              Currency: RWF
            </Badge>
          </div>
          <Input
            id="settings-platform-fee"
            type="number"
            min={0}
            max={100}
            value={draft.platformFeePercent}
            onChange={(e) => set("platformFeePercent", Number(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>{t("platformFeeDesc")}</span>
            <span className="font-medium text-foreground">
              Sim: 50,000 RWF &rarr; Fee: {(50000 * draft.platformFeePercent / 100).toLocaleString()} RWF
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="settings-min-escrow" className="text-xs font-semibold">{t("minEscrowDuration")}</Label>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium flex items-center gap-1">
              <Clock size={10} />
              {formatEscrowDuration(draft.minEscrowDurationSeconds)}
            </Badge>
          </div>
          <Input
            id="settings-min-escrow"
            type="number"
            min={0}
            value={draft.minEscrowDurationSeconds}
            onChange={(e) => set("minEscrowDurationSeconds", Number(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>{t("minEscrowDurationDesc")}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px]">Presets:</span>
              {ESCROW_PRESETS.map((p) => (
                <button
                  key={p.seconds}
                  type="button"
                  onClick={() => set("minEscrowDurationSeconds", p.seconds)}
                  className={`text-[10px] px-1 py-0.5 rounded border ${
                    draft.minEscrowDurationSeconds === p.seconds
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
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

            {draft.maintenanceMode && (
              <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-semibold block">Public Visitor Banner Preview:</span>
                  <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
                    {draft.maintenanceNotice || "MyJudicial is currently undergoing scheduled platform maintenance. Some operations may be limited."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}