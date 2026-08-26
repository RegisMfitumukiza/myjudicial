"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { User, Key, Palette, Save, Lock, Smartphone, Globe, CheckCircle, AlertTriangle, Monitor } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { usePatchAuthMe, UpdateMeDtoPreferredLanguage } from "@/api/generated";
import { apiFetch } from "@/lib/api/client";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { toast } from "sonner";
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

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Key },
  { id: "preferences", label: "Preferences", icon: Palette },
];

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

function LoginHistoryTable({ userId }: { userId: string }) {
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
        No login history available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.slice(0, 10).map((log: any, idx: number) => (
        <div key={log.id || idx} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground capitalize">
              {log.action?.toLowerCase() === "login" ? "Logged in" : log.action}
            </p>
            <p className="text-xs text-muted-foreground">
              {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Unknown time"}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{log.ipAddress || ""}</span>
        </div>
      ))}
    </div>
  );
}

function AccountActivityTable({ userId }: { userId: string }) {
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
        No activity recorded yet
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
              {log.entityType && `${log.entityType} · `}{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
            </p>
          </div>
          <span className="ml-2 shrink-0 text-xs text-muted-foreground">{log.ipAddress || ""}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const patchAuthMe = usePatchAuthMe();

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
    if (hash && TABS.some((t) => t.id === hash)) {
      setActiveTab(hash);
    } else if (!hash) {
      setActiveTab("profile");
    }
  }, []);

  /* Listen for external hash changes (back/forward navigation or clicks from sidebar dropdown) */
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "") as TabId;
      if (hash && TABS.some((t) => t.id === hash)) {
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
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
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
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
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
      toast.success("Password changed");
    } catch (err: any) {
      setPasswordError(err?.message ?? "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  /* Save Preferences */
  const handleSavePreferences = async () => {
    setSavingLanguage(true);
    try {
      await patchAuthMe.mutateAsync({ data: { preferredLanguage: language } });
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save preferences");
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
      setSessionsError("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

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
      toast.success("Session revoked");
    } catch {
      toast.error("Failed to revoke session");
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
    } catch {
      setNotifsError(null);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

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
      toast.success("Notification preferences saved");
    } catch {
      setNotifsError("Failed to save notification preferences");
    } finally {
      setSavingNotifs(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner label="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Profile"
        description="Manage your personal information, account security, and preferences"
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
        {TABS.map(({ id, label, icon: Icon }) => (
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
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="pf-first-name">
                    First Name
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
                    Last Name
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
                    Email
                  </label>
                  <Input
                    id="pf-email"
                    type="email"
                    value={user.email ?? ""}
                    readOnly
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="pf-phone">
                    Phone
                  </label>
                  <Input
                    id="pf-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250 7XX XXX XXX"
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
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <p className="text-sm text-muted-foreground">Recent login activity on your account</p>
            </CardHeader>
            <CardContent>
              <LoginHistoryTable userId={user.id} />
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
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="ac-current-pw">
                      Current Password
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
                      New Password
                    </label>
                    <Input
                      id="ac-new-pw"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {newPassword && newPassword.length < 8 && (
                      <p className="mt-1 text-xs text-destructive">Minimum 8 characters</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="ac-confirm-pw">
                      Confirm New Password
                    </label>
                    <Input
                      id="ac-confirm-pw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1 text-xs text-destructive">Passwords do not match</p>
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
                    Password updated successfully
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
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </form>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Authenticator app</span>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Not configured
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">2FA setup will be available in a future update</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <p className="text-sm text-muted-foreground">Devices and sessions currently logged into your account</p>
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
                  No active sessions
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
                            {s.device || "Unknown device"}
                            {s.isCurrent && (
                              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.browser && `${s.browser} · `}{s.ip && `${s.ip} · `}Last active: {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "N/A"}
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
                            "Revoke"
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
              <CardTitle>Account Activity</CardTitle>
              <p className="text-sm text-muted-foreground">A log of recent actions performed on your account</p>
            </CardHeader>
            <CardContent>
              <AccountActivityTable userId={user.id} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <p className="text-sm text-muted-foreground">Choose how the platform looks for you</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground">Toggle light / dark mode</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language</CardTitle>
              <p className="text-sm text-muted-foreground">Select your preferred interface language</p>
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
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="rw">Kinyarwanda</SelectItem>
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
                Save Language Preference
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <p className="text-sm text-muted-foreground">Control which notifications you receive</p>
            </CardHeader>
            <CardContent>
              {loadingNotifs ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={notifEmail}
                      onCheckedChange={setNotifEmail}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive push notifications for booking state changes</p>
                    </div>
                    <Switch
                      checked={notifPush}
                      onCheckedChange={setNotifPush}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">In-App Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive notifications inside the platform</p>
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
                    Save Notification Preferences
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
