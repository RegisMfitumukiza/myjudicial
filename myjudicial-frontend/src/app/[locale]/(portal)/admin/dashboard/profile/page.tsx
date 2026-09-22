"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { User, Key, Palette, Save, Lock, Smartphone, Globe, CheckCircle, AlertTriangle, Monitor } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { usePatchAuthMe, UpdateMeDtoPreferredLanguage } from "@/api/generated";
import { apiFetch } from "@/lib/api/client";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";

type TabId = "profile" | "account" | "preferences";

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

function getInitials(first: string, last: string) {
  return (first[0] + last[0]).toUpperCase();
}

function LoginHistoryTable({ userId, t, locale }: { userId: string; t: (key: string) => string; locale: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res: any = await apiFetch(`/admin/audit-logs?action=LOGIN&actorId=${userId}&limit=10`);
        setLogs(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
        <Globe size={18} className="mr-2" />
        {t("noLoginHistory")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.slice(0, 10).map((log: any, idx: number) => (
        <div key={log.id || idx} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground capitalize">
              {log.action?.toLowerCase() === "login" ? t("loggedIn") : log.action}
            </p>
            <p className="text-xs text-muted-foreground">
              {log.createdAt ? new Date(log.createdAt).toLocaleString(locale) : t("unknownTime")}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{log.ipAddress || ""}</span>
        </div>
      ))}
    </div>
  );
}

function AccountActivityTable({ userId, t, locale }: { userId: string; t: (key: string) => string; locale: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res: any = await apiFetch(`/admin/audit-logs?actorId=${userId}&limit=10`);
        setLogs(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
        <Globe size={18} className="mr-2" />
        {t("noActivityYet")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.slice(0, 10).map((log: any, idx: number) => (
        <div key={log.id || idx} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground capitalize">
              {log.action?.replace(/_/g, " ").toLowerCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              {log.entityType && `${log.entityType} · `}{log.createdAt ? new Date(log.createdAt).toLocaleString(locale) : ""}
            </p>
          </div>
          <span className="ml-2 shrink-0 text-xs text-muted-foreground">{log.ipAddress || ""}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminProfilePage() {
  const t = useTranslations("admin.profile");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const patchAuthMe = usePatchAuthMe();

  const tabs = useMemo<{ id: TabId; label: string; icon: React.ElementType }[]>(() => [
    { id: "profile", label: t("profileTab"), icon: User },
    { id: "account", label: t("accountTab"), icon: Key },
    { id: "preferences", label: t("preferencesTab"), icon: Palette },
  ], [t]);

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  /* Profile tab state */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  /* Account tab state */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  /* Preferences tab state */
  const [language, setLanguage] = useState<keyof typeof UpdateMeDtoPreferredLanguage>("en");
  const [savingLanguage, setSavingLanguage] = useState(false);

  /* Session management */
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  /* Notification preferences */
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifsError, setNotifsError] = useState<string | null>(null);

  /* Sync user data into form */
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.phone ?? "");
      setLanguage((user.preferredLanguage as keyof typeof UpdateMeDtoPreferredLanguage) ?? "en");
    }
  }, [user]);

  /* Read hash from URL for tab navigation */
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TabId;
    if (hash && (hash === "profile" || hash === "account" || hash === "preferences")) {
      setActiveTab(hash);
    } else if (!hash) {
      setActiveTab("profile");
    }
  }, []);

  /* Listen for external hash changes (back/forward navigation or clicks from sidebar dropdown) */
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "") as TabId;
      if (hash && (hash === "profile" || hash === "account" || hash === "preferences")) {
        setActiveTab(hash);
      } else if (!hash) {
        setActiveTab("profile");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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

  /* Change Password */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError(t("minChars"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordsNoMatch"));
      return;
    }

    setChangingPassword(true);
    try {
      await apiFetch("/auth/admin/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("passwordChanged"));
    } catch (err: any) {
      setPasswordError(err?.message ?? t("passwordChangeFailed"));
    } finally {
      setChangingPassword(false);
    }
  };

  /* Save Preferences */
  const handleSavePreferences = async () => {
    setSavingLanguage(true);
    try {
      await patchAuthMe.mutateAsync({ data: { preferredLanguage: language } });
      toast.success(t("preferencesSaved"));
      router.replace(pathname, { locale: language });
    } catch {
      toast.error(t("preferencesFailed"));
    } finally {
      setSavingLanguage(false);
    }
  };

  /* Fetch sessions */
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const res: any = await apiFetch("/auth/sessions");
      const list = (res.data?.data ?? res.data ?? []) as SessionInfo[];
      setSessions(list);
    } catch {
      setSessionsError(t("loadSessionsFailed"));
    } finally {
      setLoadingSessions(false);
    }
  }, [t]);

  useEffect(() => {
    if (activeTab === "account") {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  /* Revoke session */
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await apiFetch(`/auth/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success(t("sessionRevoked"));
    } catch {
      toast.error(t("sessionRevokeFailed"));
    } finally {
      setRevokingSessionId(null);
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
    } catch {
      setNotifsError(t("notificationsSaveFailed"));
    } finally {
      setSavingNotifs(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner label={t("loadingProfile")} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {/* Name + role banner */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {getInitials(user.firstName ?? "?", user.lastName ?? "?")}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                {user.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted p-0.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:bg-card/50"
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
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
                  <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="pf-first-name">
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
                  <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="pf-last-name">
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
                  <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="pf-email">
                    {t("email")}
                  </label>
                  <Input
                    id="pf-email"
                    type="email"
                    value={user.email ?? ""}
                    readOnly
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{t("emailReadOnly")}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="pf-phone">
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
                className="mt-4"
              >
                {savingProfile ? (
                  <span className="animate-spin">↻</span>
                ) : (
                  <Save size={15} />
                )}
                {t("saveChanges")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("loginHistory")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("loginHistoryDesc")}</p>
            </CardHeader>
            <CardContent>
              <LoginHistoryTable userId={user.id} t={t} locale={locale} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-4">
          <form onSubmit={handleChangePassword}>
            <Card>
              <CardHeader>
                <CardTitle>{t("changePassword")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="ac-current-pw">
                      {t("currentPassword")}
                    </label>
                    <Input
                      id="ac-current-pw"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="ac-new-pw">
                      {t("newPassword")}
                    </label>
                    <Input
                      id="ac-new-pw"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {newPassword && newPassword.length < 8 && (
                      <p className="mt-1 text-xs text-destructive">{t("minChars")}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="ac-confirm-pw">
                      {t("confirmNewPassword")}
                    </label>
                    <Input
                      id="ac-confirm-pw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1 text-xs text-destructive">{t("passwordsNoMatch")}</p>
                    )}
                  </div>
                </div>

                {passwordError && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                    <CheckCircle size={15} />
                    {t("passwordSuccess")}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={changingPassword || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="mt-4"
                >
                  {changingPassword ? (
                    <span className="animate-spin">↻</span>
                  ) : (
                    <Lock size={15} />
                  )}
                  {t("updatePassword")}
                </Button>
              </CardContent>
            </Card>
          </form>

          <Card>
            <CardHeader>
              <CardTitle>{t("twoFactor")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("twoFactorDesc")}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("authenticatorApp")}</span>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {t("notConfigured")}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("twoFactorFuture")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("activeSessions")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("activeSessionsDesc")}</p>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <LoadingSpinner />
              ) : sessionsError ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
                  <AlertTriangle size={18} className="mr-2" />
                  {sessionsError}
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
                  <Monitor size={18} className="mr-2" />
                  {t("noActiveSessions")}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                        s.isCurrent
                          ? "border-primary/30 bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Monitor size={18} className="shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {s.device || t("unknownDevice")}
                            {s.isCurrent && (
                              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                                {t("current")}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.browser && `${s.browser} · `}{s.ip && `${s.ip} · `}{t("lastActive")}: {s.lastActive ? new Date(s.lastActive).toLocaleDateString(locale) : t("na")}
                          </p>
                        </div>
                      </div>
                      {!s.isCurrent && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeSession(s.id)}
                          disabled={revokingSessionId === s.id}
                        >
                          {revokingSessionId === s.id ? (
                            <span className="animate-spin">↻</span>
                          ) : (
                            t("revoke")
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("accountActivity")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("accountActivityDesc")}</p>
            </CardHeader>
            <CardContent>
              <AccountActivityTable userId={user.id} t={t} locale={locale} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("appearance")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("appearanceDesc")}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground">{t("toggleTheme")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("language")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("languageDesc")}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Globe size={18} className="text-muted-foreground" />
                <Select
                  value={language}
                  onValueChange={(value) => setLanguage(value as keyof typeof UpdateMeDtoPreferredLanguage)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("langEn")}</SelectItem>
                    <SelectItem value="fr">{t("langFr")}</SelectItem>
                    <SelectItem value="rw">{t("langRw")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSavePreferences}
                disabled={savingLanguage}
                className="mt-4"
              >
                {savingLanguage ? (
                  <span className="animate-spin">↻</span>
                ) : (
                  <Save size={15} />
                )}
                {t("saveLanguage")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("notificationPreferences")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("notificationPreferencesDesc")}</p>
            </CardHeader>
            <CardContent>
              {loadingNotifs ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("emailNotifications")}</p>
                      <p className="text-xs text-muted-foreground">{t("emailNotificationsDesc")}</p>
                    </div>
                    <Switch
                      checked={notifEmail}
                      onCheckedChange={setNotifEmail}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("pushNotifications")}</p>
                      <p className="text-xs text-muted-foreground">{t("pushNotificationsDesc")}</p>
                    </div>
                    <Switch
                      checked={notifPush}
                      onCheckedChange={setNotifPush}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("inAppNotifications")}</p>
                      <p className="text-xs text-muted-foreground">{t("inAppNotificationsDesc")}</p>
                    </div>
                    <Switch
                      checked={notifInApp}
                      onCheckedChange={setNotifInApp}
                    />
                  </div>
                  <Button
                    onClick={handleSaveNotifPrefs}
                    disabled={savingNotifs}
                  >
                    {savingNotifs ? (
                      <span className="animate-spin">↻</span>
                    ) : (
                      <Save size={15} />
                    )}
                    {t("saveNotifications")}
                  </Button>
                  {notifsError && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      {notifsError}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
