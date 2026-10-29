"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import {
  User,
  Palette,
  Save,
  Globe,
  CheckCircle,
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  ArrowUpRight,
  Bell,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { usePatchAuthMe, UpdateMeDtoPreferredLanguage } from "@/api/generated";
import { apiFetch } from "@/lib/api/client";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { FormSectionSkeleton, SkeletonList } from "@/shared/components/dashboard/loading";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";

type TabId = "profile" | "preferences";

function getInitials(first: string, last: string) {
  return ((first[0] || "") + (last[0] || "")).toUpperCase() || "A";
}

export default function AdminProfilePage() {
  const t = useTranslations("admin.profile");
  const tSidebar = useTranslations("shared.sidebar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const patchAuthMe = usePatchAuthMe();
  const { theme, setTheme } = useTheme();

  const tabs = useMemo<{ id: TabId; label: string; icon: React.ElementType }[]>(() => [
    { id: "profile", label: t("profileTab"), icon: User },
    { id: "preferences", label: t("preferencesTab"), icon: Palette },
  ], [t]);

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  /* Profile tab state */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  /* Preferences tab state */
  const [language, setLanguage] = useState<keyof typeof UpdateMeDtoPreferredLanguage>("en");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifsError, setNotifsError] = useState<string | null>(null);

  /* Sync profile form when user loads */
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  /* Read hash from URL for tab navigation or route redirection */
  useEffect(() => {
    const rawHash = window.location.hash.replace("#", "");
    if (rawHash === "security" || rawHash === "account") {
      router.replace("/admin/dashboard/security");
    } else if (rawHash === "preferences") {
      setActiveTab("preferences");
    } else {
      setActiveTab("profile");
    }
  }, [router]);

  /* Listen for external hash changes */
  useEffect(() => {
    const onHashChange = () => {
      const rawHash = window.location.hash.replace("#", "");
      if (rawHash === "security" || rawHash === "account") {
        router.replace("/admin/dashboard/security");
      } else if (rawHash === "preferences") {
        setActiveTab("preferences");
      } else {
        setActiveTab("profile");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [router]);

  const handleTabClick = useCallback(
    (tabId: TabId) => {
      setActiveTab(tabId);
      setTimeout(() => {
        router.replace(`/admin/dashboard/profile#${tabId}`, { scroll: false });
      }, 0);
    },
    [router],
  );

  /* Save Profile */
  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setSavingProfile(true);
    try {
      await apiFetch("/auth/me", {
        method: "PATCH",
        body: { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() },
      });
      toast.success(t("profileUpdated"));
    } catch {
      toast.error(t("profileUpdateFailed"));
    } finally {
      setSavingProfile(false);
    }
  };

  /* Auto-save language upon selection */
  const handleLanguageChange = async (newLang: keyof typeof UpdateMeDtoPreferredLanguage) => {
    setLanguage(newLang);
    try {
      await patchAuthMe.mutateAsync({ data: { preferredLanguage: newLang } });
      toast.success(t("preferencesSaved"));
      router.replace(pathname, { locale: newLang });
    } catch {
      toast.error(t("preferencesFailed"));
    }
  };

  /* Fetch notification preferences */
  const fetchNotifPrefs = useCallback(async () => {
    setLoadingNotifs(true);
    setNotifsError(null);
    try {
      const res: any = await apiFetch("/auth/me/notification-preferences");
      const prefs = res.data?.data ?? res.data ?? {};
      setNotifEmail(prefs.email ?? true);
      setNotifPush(prefs.push ?? true);
      setNotifInApp(prefs.inApp ?? true);
    } catch (err) {
      setNotifsError(
        err instanceof Error
          ? err.message
          : t("notificationsLoadFailed"),
      );
    } finally {
      setLoadingNotifs(false);
    }
  }, [t]);

  useEffect(() => {
    if (activeTab === "preferences") {
      fetchNotifPrefs();
    }
  }, [activeTab, fetchNotifPrefs]);

  /* Save notification preferences */
  const handleSaveNotifPrefs = async () => {
    setSavingNotifs(true);
    setNotifsError(null);
    try {
      await apiFetch("/auth/me/notification-preferences", {
        method: "PUT",
        body: { email: notifEmail, push: notifPush, inApp: notifInApp },
      });
      toast.success(t("notificationsSaved"));
    } catch (err) {
      setNotifsError(
        err instanceof Error
          ? err.message
          : t("notificationsSaveFailed"),
      );
    } finally {
      setSavingNotifs(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0 max-w-4xl">
        <FormSectionSkeleton fields={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0 max-w-4xl">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {/* Name + role banner */}
      <Card>
        <CardContent className="p-3.5 sm:p-5">
          <div className="flex flex-col min-[380px]:flex-row items-center min-[380px]:items-start gap-3 sm:gap-4 min-w-0 text-center min-[380px]:text-left">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-primary text-base sm:text-lg font-bold text-primary-foreground">
              {getInitials(user.firstName ?? "?", user.lastName ?? "?")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-semibold text-foreground break-words">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground break-all select-all">{user.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-primary">
                {user.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2 Canonical Tabs: Profile & Preferences */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:bg-card/50"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("personalInformation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground" htmlFor="pf-first-name">
                    {t("firstName")}
                  </label>
                  <Input
                    id="pf-first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground" htmlFor="pf-last-name">
                    {t("lastName")}
                  </label>
                  <Input
                    id="pf-last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground" htmlFor="pf-email">
                    {t("email")}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pf-email"
                      type="email"
                      value={user.email ?? ""}
                      readOnly
                      className="bg-muted/40 font-mono text-xs"
                    />
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle size={12} />
                      Verified
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t("emailReadOnly")}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground" htmlFor="pf-phone">
                    {t("phone")}
                  </label>
                  <Input
                    id="pf-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("phonePlaceholder")}
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile || !firstName.trim() || !lastName.trim()}
                className="mt-5 w-full sm:w-auto"
              >
                {savingProfile ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                {t("saveChanges")}
              </Button>
            </CardContent>
          </Card>

          {/* Quick link to Security settings */}
          <Card className="border-border/60 bg-muted/20">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{tSidebar("security")}</p>
                  <p className="text-xs text-muted-foreground">{t("activeSessionsDesc")}</p>
                </div>
              </div>
              <Link
                href="/admin/dashboard/security"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
              >
                <span>{tSidebar("security")}</span>
                <ArrowUpRight size={14} />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="space-y-4">
          {/* Visual Theme Selector (Linear / GitHub style) */}
          <Card>
            <CardHeader>
              <CardTitle>{t("appearance")}</CardTitle>
              <CardDescription>{t("appearanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg">
                {[
                  { id: "light", label: "Light", icon: Sun },
                  { id: "dark", label: "Dark", icon: Moon },
                  { id: "system", label: "System", icon: Laptop },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTheme(item.id)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 sm:p-4 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <Icon size={20} className="shrink-0" />
                      <span className="text-xs sm:text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Language Preference with Auto-Save */}
          <Card>
            <CardHeader>
              <CardTitle>{t("language")}</CardTitle>
              <CardDescription>{t("languageDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 min-w-0">
                <Globe size={18} className="shrink-0 text-muted-foreground" />
                <Select
                  value={locale as any}
                  onValueChange={(val) => handleLanguageChange(val as keyof typeof UpdateMeDtoPreferredLanguage)}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("langEn")}</SelectItem>
                    <SelectItem value="fr">{t("langFr")}</SelectItem>
                    <SelectItem value="rw">{t("langRw")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">Changes language immediately across the entire dashboard.</p>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={18} className="text-primary shrink-0" />
                {t("notificationPreferences")}
              </CardTitle>
              <CardDescription>{t("notificationPreferencesDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNotifs ? (
                <SkeletonList count={2} itemClassName="h-14 rounded-lg" />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 sm:px-4 sm:py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground leading-snug break-words">{t("emailNotifications")}</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{t("emailNotificationsDesc")}</p>
                    </div>
                    <Switch
                      checked={notifEmail}
                      onCheckedChange={setNotifEmail}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 sm:px-4 sm:py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground leading-snug break-words">{t("pushNotifications")}</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{t("pushNotificationsDesc")}</p>
                    </div>
                    <Switch
                      checked={notifPush}
                      onCheckedChange={setNotifPush}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 sm:px-4 sm:py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground leading-snug break-words">{t("inAppNotifications")}</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{t("inAppNotificationsDesc")}</p>
                    </div>
                    <Switch
                      checked={notifInApp}
                      onCheckedChange={setNotifInApp}
                    />
                  </div>

                  {notifsError && (
                    <p className="text-xs text-destructive">{notifsError}</p>
                  )}

                  <Button
                    onClick={handleSaveNotifPrefs}
                    disabled={savingNotifs}
                    className="w-full sm:w-auto"
                  >
                    {savingNotifs ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    {t("saveNotifications")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
