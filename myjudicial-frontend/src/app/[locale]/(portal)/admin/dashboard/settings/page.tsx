"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { Switch } from "@/shared/components/ui/switch";
import { useTranslations } from "next-intl";

interface SettingsData {
  platformName: string;
  maintenanceMode: boolean;
  defaultRole: string;
  platformFeePercent: number;
  minEscrowDurationSeconds: number;
  paymentMode: "BOOKING_FIRST" | "PAYMENT_REQUIRED";
}

const DEFAULTS: SettingsData = {
  platformName: "MyJudicial",
  maintenanceMode: false,
  defaultRole: "CITIZEN",
  platformFeePercent: 15,
  minEscrowDurationSeconds: 300,
  paymentMode: "BOOKING_FIRST",
};

export default function SettingsPage() {
  const t = useTranslations("admin.settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backendUnreachable, setBackendUnreachable] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [platformName, setPlatformName] = useState(DEFAULTS.platformName);
  const [maintenanceMode, setMaintenanceMode] = useState(DEFAULTS.maintenanceMode);
  const [defaultRole, setDefaultRole] = useState(DEFAULTS.defaultRole);
  const [platformFeePercent, setPlatformFeePercent] = useState(DEFAULTS.platformFeePercent);
  const [minEscrowDurationSeconds, setMinEscrowDurationSeconds] = useState(DEFAULTS.minEscrowDurationSeconds);
  const [paymentMode, setPaymentMode] = useState<SettingsData["paymentMode"]>(DEFAULTS.paymentMode);

  const loadSettings = () => {
    setLoading(true);
    setBackendUnreachable(false);
    apiFetch("/admin/settings")
      .then((res: any) => {
        const d = (res.data?.data ?? res.data) as SettingsData;
        setPlatformName(d.platformName ?? DEFAULTS.platformName);
        setMaintenanceMode(d.maintenanceMode ?? DEFAULTS.maintenanceMode);
        setDefaultRole(d.defaultRole ?? DEFAULTS.defaultRole);
        setPlatformFeePercent(d.platformFeePercent ?? DEFAULTS.platformFeePercent);
        setMinEscrowDurationSeconds(d.minEscrowDurationSeconds ?? DEFAULTS.minEscrowDurationSeconds);
        setPaymentMode(d.paymentMode ?? DEFAULTS.paymentMode);
        setBackendUnreachable(false);
      })
      .catch(() => {
        setBackendUnreachable(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSettings(); }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch("/admin/settings", {
        method: "PUT",
        body: { platformName, maintenanceMode, defaultRole, platformFeePercent, minEscrowDurationSeconds, paymentMode },
      });
      toast.success(t("settingsSaved"));
    } catch {
      setSaveError(t("settingsUnavailable"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#000" }}>{t("title")}</h1>
          <p className="text-sm" style={{ color: "#000" }}>{t("subtitle")}</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-[#e2e8f0] bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#000" }}>{t("title")}</h1>
        <p className="text-sm" style={{ color: "#000" }}>{t("subtitle")}</p>
      </div>

      {backendUnreachable && (
        <div className="flex items-start gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4">
          <WifiOff size={18} className="mt-0.5 shrink-0" style={{ color: "#d32f2f" }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "#000" }}>{t("serverUnreachable")}</p>
            <p className="mt-0.5 text-xs" style={{ color: "#000" }}>
              {t("showingDefaults")}
            </p>
          </div>
          <button
            onClick={loadSettings}
            className="shrink-0 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-medium hover:bg-[#f8fafc]"
            style={{ color: "#000" }}
          >
            <RefreshCw size={12} className="mr-1 inline" /> {t("retry")}
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 className="mb-1 text-base font-bold" style={{ color: "#000" }}>{t("platformName")}</h3>
          <p className="mb-3 text-sm" style={{ color: "#000" }}>{t("platformNameDesc")}</p>
          <input
            type="text"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            id="settings-platform-name"
            className="w-full max-w-md h-11 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm"
            style={{ color: "#000" }}
          />
        </div>

        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 className="mb-1 text-base font-bold" style={{ color: "#000" }}>{t("maintenanceMode")}</h3>
          <p className="mb-3 text-sm" style={{ color: "#000" }}>{t("maintenanceModeDesc")}</p>
          <div className="flex items-center gap-3">
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            <span className="text-sm" style={{ color: "#000" }}>
              {maintenanceMode ? t("enabled") : t("disabled")}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 className="mb-1 text-base font-bold" style={{ color: "#000" }}>{t("defaultUserRole")}</h3>
          <p className="mb-3 text-sm" style={{ color: "#000" }}>{t("defaultUserRoleDesc")}</p>
          <select
            value={defaultRole}
            onChange={(e) => setDefaultRole(e.target.value)}
            id="settings-default-role"
            className="w-full max-w-xs h-11 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm"
            style={{ color: "#000" }}
          >
            <option value="CITIZEN">{t("citizen")}</option>
            <option value="EXPERT">{t("expert")}</option>
          </select>
        </div>

        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 className="mb-1 text-base font-bold" style={{ color: "#000" }}>{t("platformFee")}</h3>
          <p className="mb-3 text-sm" style={{ color: "#000" }}>{t("platformFeeDesc")}</p>
          <input
            type="number"
            min={0}
            max={100}
            value={platformFeePercent}
            onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
            id="settings-platform-fee"
            className="w-full max-w-xs h-11 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm"
            style={{ color: "#000" }}
          />
        </div>

        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 className="mb-1 text-base font-bold" style={{ color: "#000" }}>{t("minEscrowDuration")}</h3>
          <p className="mb-3 text-sm" style={{ color: "#000" }}>{t("minEscrowDurationDesc")}</p>
          <input
            type="number"
            min={0}
            value={minEscrowDurationSeconds}
            onChange={(e) => setMinEscrowDurationSeconds(Number(e.target.value))}
            id="settings-min-escrow-duration"
            className="w-full max-w-xs h-11 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm"
            style={{ color: "#000" }}
          />
        </div>
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 className="mb-1 text-base font-bold" style={{ color: "#000" }}>{t("paymentMode")}</h3>
          <p className="mb-3 text-sm" style={{ color: "#000" }}>{t("paymentModeDesc")}</p>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as SettingsData["paymentMode"])}
            id="settings-payment-mode"
            className="w-full max-w-xs h-11 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm"
            style={{ color: "#000" }}
          >
            <option value="BOOKING_FIRST">{t("bookingFirst")}</option>
            <option value="PAYMENT_REQUIRED">{t("paymentRequired")}</option>
          </select>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 rounded-lg border border-[#d32f2f] bg-white px-4 py-3 text-sm" style={{ color: "#d32f2f" }}>
          <AlertTriangle size={15} className="shrink-0" />
          {saveError}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-[#0b2545] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#0b2545]/80 disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {t("saveChanges")}
      </button>
    </div>
  );
}
