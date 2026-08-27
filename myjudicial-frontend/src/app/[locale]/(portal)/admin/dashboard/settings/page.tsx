"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard";
import { LoadingSpinner } from "@/shared/components/dashboard";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
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
import { Alert, AlertDescription } from "@/shared/components/ui/alert";

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
  const [platformName, setPlatformName] = useState(DEFAULTS.platformName);
  const [maintenanceMode, setMaintenanceMode] = useState(DEFAULTS.maintenanceMode);
  const [defaultRole, setDefaultRole] = useState(DEFAULTS.defaultRole);
  const [platformFeePercent, setPlatformFeePercent] = useState(DEFAULTS.platformFeePercent);
  const [minEscrowDurationSeconds, setMinEscrowDurationSeconds] = useState(DEFAULTS.minEscrowDurationSeconds);
  const [paymentMode, setPaymentMode] = useState<SettingsData["paymentMode"]>(DEFAULTS.paymentMode);

  const loadSettings = () => {
    setLoading(true);
    setBackendUnreachable(false);
    apiFetch<{ data?: { data?: SettingsData } }>("/admin/settings")
      .then((res) => {
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
    try {
      await apiFetch("/admin/settings", {
        method: "PUT",
        body: { platformName, maintenanceMode, defaultRole, platformFeePercent, minEscrowDurationSeconds, paymentMode },
      });
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("settingsUnavailable"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("saveChanges")}
          </Button>
        }
      />

      {backendUnreachable && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("serverUnreachable")}</p>
              <p className="text-xs text-muted-foreground">{t("showingDefaults")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadSettings}>
              <RefreshCw className="h-3 w-3" /> {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="space-y-2">
              <Label htmlFor="settings-platform-name">{t("platformName")}</Label>
              <p className="text-xs text-muted-foreground">{t("platformNameDesc")}</p>
              <Input
                id="settings-platform-name"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="space-y-2">
              <Label>{t("maintenanceMode")}</Label>
              <p className="text-xs text-muted-foreground">{t("maintenanceModeDesc")}</p>
              <div className="flex items-center gap-3">
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                <span className="text-sm text-muted-foreground">
                  {maintenanceMode ? t("enabled") : t("disabled")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="space-y-2">
              <Label>{t("defaultUserRole")}</Label>
              <p className="text-xs text-muted-foreground">{t("defaultUserRoleDesc")}</p>
              <Select value={defaultRole} onValueChange={setDefaultRole}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CITIZEN">{t("citizen")}</SelectItem>
                  <SelectItem value="EXPERT">{t("expert")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="space-y-2">
              <Label htmlFor="settings-platform-fee">{t("platformFee")}</Label>
              <p className="text-xs text-muted-foreground">{t("platformFeeDesc")}</p>
              <Input
                id="settings-platform-fee"
                type="number"
                min={0}
                max={100}
                value={platformFeePercent}
                onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="space-y-2">
              <Label htmlFor="settings-min-escrow">{t("minEscrowDuration")}</Label>
              <p className="text-xs text-muted-foreground">{t("minEscrowDurationDesc")}</p>
              <Input
                id="settings-min-escrow"
                type="number"
                min={0}
                value={minEscrowDurationSeconds}
                onChange={(e) => setMinEscrowDurationSeconds(Number(e.target.value))}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="space-y-2">
              <Label>{t("paymentMode")}</Label>
              <p className="text-xs text-muted-foreground">{t("paymentModeDesc")}</p>
              <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as SettingsData["paymentMode"])}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOKING_FIRST">{t("bookingFirst")}</SelectItem>
                  <SelectItem value="PAYMENT_REQUIRED">{t("paymentRequired")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
