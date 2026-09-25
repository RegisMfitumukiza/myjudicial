"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, WifiOff, RefreshCw, Building2, Phone, Mail, FileText, Share2, Shield } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard";
import { LoadingSpinner } from "@/shared/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
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
  // Company & Contact Details
  supportEmail: string;
  hotlinePhone: string;
  whatsappNumber: string;
  officeBuilding: string;
  officeStreet: string;
  officeDistrict: string;
  officePoBox: string;
  // Public Editorial Content
  aboutVision: string;
  aboutMission: string;
  aboutStory: string;
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
  supportEmail: "support@myjudicial.com",
  hotlinePhone: "+250 788 312 456",
  whatsappNumber: "+250 788 312 456",
  officeBuilding: "Centenary House, 4th Floor",
  officeStreet: "KN 3 Ave & KN 4 St",
  officeDistrict: "Nyarugenge Central Business District, Kigali, Rwanda",
  officePoBox: "P.O. Box 2848, Kigali",
  aboutVision: "",
  aboutMission: "",
  aboutStory: "",
};

export default function SettingsPage() {
  const t = useTranslations("admin.settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backendUnreachable, setBackendUnreachable] = useState(false);

  // Platform & Financial Governance
  const [platformName, setPlatformName] = useState(DEFAULTS.platformName);
  const [maintenanceMode, setMaintenanceMode] = useState(DEFAULTS.maintenanceMode);
  const [defaultRole, setDefaultRole] = useState(DEFAULTS.defaultRole);
  const [platformFeePercent, setPlatformFeePercent] = useState(DEFAULTS.platformFeePercent);
  const [minEscrowDurationSeconds, setMinEscrowDurationSeconds] = useState(DEFAULTS.minEscrowDurationSeconds);
  const [paymentMode, setPaymentMode] = useState<SettingsData["paymentMode"]>(DEFAULTS.paymentMode);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(DEFAULT_SOCIAL);

  // Company & Contact Channels
  const [supportEmail, setSupportEmail] = useState(DEFAULTS.supportEmail);
  const [hotlinePhone, setHotlinePhone] = useState(DEFAULTS.hotlinePhone);
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULTS.whatsappNumber);

  // Physical Headquarters Location
  const [officeBuilding, setOfficeBuilding] = useState(DEFAULTS.officeBuilding);
  const [officeStreet, setOfficeStreet] = useState(DEFAULTS.officeStreet);
  const [officeDistrict, setOfficeDistrict] = useState(DEFAULTS.officeDistrict);
  const [officePoBox, setOfficePoBox] = useState(DEFAULTS.officePoBox);

  // Public Editorial Content (About Mini-CMS)
  const [aboutVision, setAboutVision] = useState(DEFAULTS.aboutVision);
  const [aboutMission, setAboutMission] = useState(DEFAULTS.aboutMission);
  const [aboutStory, setAboutStory] = useState(DEFAULTS.aboutStory);

  const [originalSettings, setOriginalSettings] = useState<SettingsData>(DEFAULTS);

  const isDirty =
    platformName !== originalSettings.platformName ||
    maintenanceMode !== originalSettings.maintenanceMode ||
    defaultRole !== originalSettings.defaultRole ||
    platformFeePercent !== originalSettings.platformFeePercent ||
    minEscrowDurationSeconds !== originalSettings.minEscrowDurationSeconds ||
    paymentMode !== originalSettings.paymentMode ||
    supportEmail !== originalSettings.supportEmail ||
    hotlinePhone !== originalSettings.hotlinePhone ||
    whatsappNumber !== originalSettings.whatsappNumber ||
    officeBuilding !== originalSettings.officeBuilding ||
    officeStreet !== originalSettings.officeStreet ||
    officeDistrict !== originalSettings.officeDistrict ||
    officePoBox !== originalSettings.officePoBox ||
    aboutVision !== originalSettings.aboutVision ||
    aboutMission !== originalSettings.aboutMission ||
    aboutStory !== originalSettings.aboutStory ||
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
          supportEmail: d.supportEmail ?? DEFAULTS.supportEmail,
          hotlinePhone: d.hotlinePhone ?? DEFAULTS.hotlinePhone,
          whatsappNumber: d.whatsappNumber ?? DEFAULTS.whatsappNumber,
          officeBuilding: d.officeBuilding ?? DEFAULTS.officeBuilding,
          officeStreet: d.officeStreet ?? DEFAULTS.officeStreet,
          officeDistrict: d.officeDistrict ?? DEFAULTS.officeDistrict,
          officePoBox: d.officePoBox ?? DEFAULTS.officePoBox,
          aboutVision: d.aboutVision ?? DEFAULTS.aboutVision,
          aboutMission: d.aboutMission ?? DEFAULTS.aboutMission,
          aboutStory: d.aboutStory ?? DEFAULTS.aboutStory,
        };
        setPlatformName(loaded.platformName);
        setMaintenanceMode(loaded.maintenanceMode);
        setDefaultRole(loaded.defaultRole);
        setPlatformFeePercent(loaded.platformFeePercent);
        setMinEscrowDurationSeconds(loaded.minEscrowDurationSeconds);
        setPaymentMode(loaded.paymentMode);
        setSocialLinks(loaded.socialLinks ?? DEFAULT_SOCIAL);
        setSupportEmail(loaded.supportEmail);
        setHotlinePhone(loaded.hotlinePhone);
        setWhatsappNumber(loaded.whatsappNumber);
        setOfficeBuilding(loaded.officeBuilding);
        setOfficeStreet(loaded.officeStreet);
        setOfficeDistrict(loaded.officeDistrict);
        setOfficePoBox(loaded.officePoBox);
        setAboutVision(loaded.aboutVision);
        setAboutMission(loaded.aboutMission);
        setAboutStory(loaded.aboutStory);
        setOriginalSettings(loaded);
        setBackendUnreachable(false);
      })
      .catch(() => {
        setBackendUnreachable(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Partial<SettingsData> = {
        platformName,
        maintenanceMode,
        defaultRole,
        platformFeePercent,
        minEscrowDurationSeconds,
        paymentMode,
        socialLinks,
        supportEmail,
        hotlinePhone,
        whatsappNumber,
        officeBuilding,
        officeStreet,
        officeDistrict,
        officePoBox,
        aboutVision,
        aboutMission,
        aboutStory,
      };

      await apiFetch("/admin/settings", {
        method: "PUT",
        body: payload,
      });

      setOriginalSettings({
        platformName,
        maintenanceMode,
        defaultRole,
        platformFeePercent,
        minEscrowDurationSeconds,
        paymentMode,
        socialLinks,
        supportEmail,
        hotlinePhone,
        whatsappNumber,
        officeBuilding,
        officeStreet,
        officeDistrict,
        officePoBox,
        aboutVision,
        aboutMission,
        aboutStory,
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
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={handleSave} disabled={saving || !isDirty} className="font-bold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
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
              <RefreshCw className="h-3 w-3 mr-1" /> {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Section 1: Company & Official Contact Channels ──────────── */}
      <Card className="rounded-2xl border border-border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-foreground" />
            <CardTitle className="text-base font-bold text-foreground">{t("companyDetailsTitle")}</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {t("companyDetailsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="settings-support-email" className="text-xs font-semibold">
                {t("supportEmail")}
              </Label>
              <Input
                id="settings-support-email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
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
                value={hotlinePhone}
                onChange={(e) => setHotlinePhone(e.target.value)}
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
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+250 788 312 456"
              />
              <p className="text-[11px] text-muted-foreground">{t("whatsappNumberDesc")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Physical Headquarters Location ────────────────── */}
      <Card className="rounded-2xl border border-border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-foreground" />
            <CardTitle className="text-base font-bold text-foreground">{t("officeTitle")}</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {t("officeDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-office-building" className="text-xs font-semibold">
                {t("officeBuilding")}
              </Label>
              <Input
                id="settings-office-building"
                value={officeBuilding}
                onChange={(e) => setOfficeBuilding(e.target.value)}
                placeholder="Centenary House, 4th Floor"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-office-street" className="text-xs font-semibold">
                {t("officeStreet")}
              </Label>
              <Input
                id="settings-office-street"
                value={officeStreet}
                onChange={(e) => setOfficeStreet(e.target.value)}
                placeholder="KN 3 Ave & KN 4 St"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-office-district" className="text-xs font-semibold">
                {t("officeDistrict")}
              </Label>
              <Input
                id="settings-office-district"
                value={officeDistrict}
                onChange={(e) => setOfficeDistrict(e.target.value)}
                placeholder="Nyarugenge CBD, Kigali, Rwanda"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-office-pobox" className="text-xs font-semibold">
                {t("officePoBox")}
              </Label>
              <Input
                id="settings-office-pobox"
                value={officePoBox}
                onChange={(e) => setOfficePoBox(e.target.value)}
                placeholder="P.O. Box 2848, Kigali"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: About Page Editorial Content (Mini-CMS) ────────── */}
      <Card className="rounded-2xl border border-border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-foreground" />
            <CardTitle className="text-base font-bold text-foreground">{t("aboutCmsTitle")}</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {t("aboutCmsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-about-mission" className="text-xs font-semibold">
              {t("aboutMission")}
            </Label>
            <Textarea
              id="settings-about-mission"
              rows={2}
              value={aboutMission}
              onChange={(e) => setAboutMission(e.target.value)}
              placeholder="e.g. To democratize access to justice in Rwanda by providing a trusted, transparent, and legally compliant digital platform..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-about-vision" className="text-xs font-semibold">
              {t("aboutVision")}
            </Label>
            <Textarea
              id="settings-about-vision"
              rows={2}
              value={aboutVision}
              onChange={(e) => setAboutVision(e.target.value)}
              placeholder="e.g. To become the premier digital legal infrastructure for East Africa..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-about-story" className="text-xs font-semibold">
              {t("aboutStory")}
            </Label>
            <Textarea
              id="settings-about-story"
              rows={4}
              value={aboutStory}
              onChange={(e) => setAboutStory(e.target.value)}
              placeholder="e.g. Founded in Kigali, MyJudicial was established to bridge the gap between citizens seeking trusted counsel and certified Rwanda Bar Association advocates..."
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4: Platform Operations & Escrow ─────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border border-border shadow-xs">
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

        <Card className="rounded-2xl border border-border shadow-xs">
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

        <Card className="rounded-2xl border border-border shadow-xs">
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

        <Card className="rounded-2xl border border-border shadow-xs">
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

        <Card className="rounded-2xl border border-border shadow-xs">
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

        <Card className="rounded-2xl border border-border shadow-xs">
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
      </div>

      {/* ── Section 5: Social Media & Public Channels ───────────────── */}
      <Card className="rounded-2xl border border-border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-foreground" />
            <CardTitle className="text-base font-bold text-foreground">{t("socialLinksTitle")}</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {t("socialLinksDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="social-x" className="text-xs font-semibold">X (Twitter)</Label>
              <Input
                id="social-x"
                placeholder="https://x.com/myjudicial"
                value={socialLinks.x ?? ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, x: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="social-linkedin" className="text-xs font-semibold">LinkedIn</Label>
              <Input
                id="social-linkedin"
                placeholder="https://linkedin.com/company/myjudicial"
                value={socialLinks.linkedin ?? ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="social-facebook" className="text-xs font-semibold">Facebook</Label>
              <Input
                id="social-facebook"
                placeholder="https://facebook.com/myjudicial"
                value={socialLinks.facebook ?? ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="social-instagram" className="text-xs font-semibold">Instagram</Label>
              <Input
                id="social-instagram"
                placeholder="https://instagram.com/myjudicial"
                value={socialLinks.instagram ?? ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="social-youtube" className="text-xs font-semibold">YouTube</Label>
              <Input
                id="social-youtube"
                placeholder="https://youtube.com/@myjudicial"
                value={socialLinks.youtube ?? ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="social-whatsapp" className="text-xs font-semibold">WhatsApp Link</Label>
              <Input
                id="social-whatsapp"
                placeholder="https://wa.me/250788312456"
                value={socialLinks.whatsapp ?? ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
