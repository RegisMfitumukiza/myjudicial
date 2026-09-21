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

export interface SocialLinks {
  x?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  whatsapp?: string;
}

interface SettingsData {
  platformName: string;
  maintenanceMode: boolean;
  defaultRole: string;
  platformFeePercent: number;
  minEscrowDurationSeconds: number;
  paymentMode: "BOOKING_FIRST" | "PAYMENT_REQUIRED";
  socialLinks?: SocialLinks;
}

const DEFAULT_SOCIAL: SocialLinks = {
  x: "https://twitter.com/myjudicial",
  linkedin: "https://linkedin.com/company/myjudicial",
  facebook: "https://facebook.com/myjudicial",
  instagram: "https://instagram.com/myjudicial",
  youtube: "",
  whatsapp: "",
};

const DEFAULTS: SettingsData = {
  platformName: "MyJudicial",
  maintenanceMode: false,
  defaultRole: "CITIZEN",
  platformFeePercent: 15,
  minEscrowDurationSeconds: 300,
  paymentMode: "PAYMENT_REQUIRED",
  socialLinks: DEFAULT_SOCIAL,
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
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(DEFAULT_SOCIAL);
  const [originalSettings, setOriginalSettings] = useState<SettingsData>(DEFAULTS);

  const isDirty =
    platformName !== originalSettings.platformName ||
    maintenanceMode !== originalSettings.maintenanceMode ||
    defaultRole !== originalSettings.defaultRole ||
    platformFeePercent !== originalSettings.platformFeePercent ||
    minEscrowDurationSeconds !== originalSettings.minEscrowDurationSeconds ||
    paymentMode !== originalSettings.paymentMode ||
    JSON.stringify(socialLinks) !== JSON.stringify(originalSettings.socialLinks ?? DEFAULT_SOCIAL);

  const loadSettings = () => {
    setLoading(true);
    setBackendUnreachable(false);
    apiFetch<{ data?: { data?: SettingsData } }>("/admin/settings")
      .then((res) => {
        const d = (res.data?.data ?? res.data) as SettingsData;
        const loaded: SettingsData = {
          platformName: d.platformName ?? DEFAULTS.platformName,
          maintenanceMode: d.maintenanceMode ?? DEFAULTS.maintenanceMode,
          defaultRole: d.defaultRole ?? DEFAULTS.defaultRole,
          platformFeePercent: d.platformFeePercent ?? DEFAULTS.platformFeePercent,
          minEscrowDurationSeconds: d.minEscrowDurationSeconds ?? DEFAULTS.minEscrowDurationSeconds,
          paymentMode: d.paymentMode ?? DEFAULTS.paymentMode,
          socialLinks: d.socialLinks ?? DEFAULT_SOCIAL,
        };
        setPlatformName(loaded.platformName);
        setMaintenanceMode(loaded.maintenanceMode);
        setDefaultRole(loaded.defaultRole);
        setPlatformFeePercent(loaded.platformFeePercent);
        setMinEscrowDurationSeconds(loaded.minEscrowDurationSeconds);
        setPaymentMode(loaded.paymentMode);
        setSocialLinks(loaded.socialLinks ?? DEFAULT_SOCIAL);
        setOriginalSettings(loaded);
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
        body: {
          platformName,
          maintenanceMode,
          defaultRole,
          platformFeePercent,
          minEscrowDurationSeconds,
          paymentMode,
          socialLinks,
        },
      });
      setOriginalSettings({
        platformName,
        maintenanceMode,
        defaultRole,
        platformFeePercent,
        minEscrowDurationSeconds,
        paymentMode,
        socialLinks,
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
          <Button onClick={handleSave} disabled={saving || !isDirty}>
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
                  <SelectItem value="PAYMENT_REQUIRED">{t("paymentRequired")}</SelectItem>
                  <SelectItem value="BOOKING_FIRST">{t("bookingFirst")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Social Media & Public Channels */}
        <Card className="md:col-span-2">
          <CardContent className="p-5">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">{t("socialLinksTitle")}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t("socialLinksDesc")}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="social-x" className="text-xs font-medium">X (Twitter)</Label>
                  <Input
                    id="social-x"
                    placeholder="https://x.com/myjudicial"
                    value={socialLinks.x ?? ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, x: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="social-linkedin" className="text-xs font-medium">LinkedIn</Label>
                  <Input
                    id="social-linkedin"
                    placeholder="https://linkedin.com/company/myjudicial"
                    value={socialLinks.linkedin ?? ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="social-facebook" className="text-xs font-medium">Facebook</Label>
                  <Input
                    id="social-facebook"
                    placeholder="https://facebook.com/myjudicial"
                    value={socialLinks.facebook ?? ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="social-instagram" className="text-xs font-medium">Instagram</Label>
                  <Input
                    id="social-instagram"
                    placeholder="https://instagram.com/myjudicial"
                    value={socialLinks.instagram ?? ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="social-youtube" className="text-xs font-medium">YouTube</Label>
                  <Input
                    id="social-youtube"
                    placeholder="https://youtube.com/@myjudicial"
                    value={socialLinks.youtube ?? ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="social-whatsapp" className="text-xs font-medium">WhatsApp</Label>
                  <Input
                    id="social-whatsapp"
                    placeholder="https://wa.me/250780000000"
                    value={socialLinks.whatsapp ?? ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
