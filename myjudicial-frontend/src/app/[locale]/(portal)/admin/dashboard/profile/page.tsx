"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { User, Key, Palette, Loader2, Save, Lock, Smartphone, Globe, CheckCircle, AlertTriangle, Monitor } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { usePatchAuthMe, UpdateMeDtoPreferredLanguage } from "@/api/generated";
import { apiFetch } from "@/lib/api/client";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { toast } from "sonner";

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
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-brand-border/20 py-8 text-sm text-gray-400">
        <Globe size={18} className="mr-2" />
        No login history available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.slice(0, 10).map((log: any, idx: number) => (
        <div key={log.id || idx} className="flex items-center justify-between rounded-lg border border-brand-border/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
              {log.action?.toLowerCase() === "login" ? "Logged in" : log.action}
            </p>
            <p className="text-xs text-gray-500">
              {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Unknown time"}
            </p>
          </div>
          <span className="text-xs text-gray-400">{log.ipAddress || ""}</span>
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
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-brand-border/20 py-8 text-sm text-gray-400">
        <Globe size={18} className="mr-2" />
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.slice(0, 10).map((log: any, idx: number) => (
        <div key={log.id || idx} className="flex items-center justify-between rounded-lg border border-brand-border/20 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
              {log.action?.replace(/_/g, " ").toLowerCase()}
            </p>
            <p className="text-xs text-gray-500">
              {log.entityType && `${log.entityType} · `}{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
            </p>
          </div>
          <span className="shrink-0 ml-2 text-xs text-gray-400">{log.ipAddress || ""}</span>
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
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
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
      // No hash, default to profile tab
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
      // Use setTimeout to avoid blocking the state update
      setTimeout(() => {
        router.replace(`/admin/dashboard/profile#${tabId}`, { scroll: false });
      }, 0);
    },
    [router],
  );

  /* ── Save Profile ── */
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

  /* ── Change Password ── */
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

  /* ── Save Preferences ── */
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

  /* ── Fetch sessions ── */
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

  /* ── Revoke session ── */
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

  /* ── Fetch notification preferences ── */
  const fetchNotifPrefs = useCallback(async () => {
    setLoadingNotifs(true);
    setNotifsError(null);
    try {
      const res: any = await apiFetch("/auth/me/notification-preferences");
      const prefs = res.data?.data ?? res.data ?? {};
      setNotifEmail(prefs.email ?? true);
      setNotifWhatsapp(prefs.whatsapp ?? true);
      setNotifPush(prefs.push ?? true);
      setNotifInApp(prefs.inApp ?? true);
    } catch {
      setNotifsError(null); // silently use defaults
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "preferences") {
      fetchNotifPrefs();
    }
  }, [activeTab, fetchNotifPrefs]);

  /* ── Save notification preferences ── */
  const handleSaveNotifPrefs = async () => {
    setSavingNotifs(true);
    setNotifsError(null);
    try {
      await apiFetch("/auth/me/notification-preferences", {
        method: "PUT",
        body: { email: notifEmail, whatsapp: notifWhatsapp, push: notifPush, inApp: notifInApp },
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your personal information, account security, and preferences</p>
      </div>

      {/* Name + role banner */}
      <div className="flex items-center gap-4 rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-dark text-lg font-bold text-white dark:bg-white dark:text-black">
          {getInitials(user.firstName ?? "?", user.lastName ?? "?")}
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-brand-dark/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-dark dark:bg-white/10 dark:text-white">
            {user.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-brand-border/20 bg-white p-1 shadow-md dark:bg-gray-900">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-brand-dark text-white shadow-sm dark:bg-white dark:text-black"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Personal Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="pf-first-name">
                  First Name
                </label>
                <input
                  id="pf-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="pf-last-name">
                  Last Name
                </label>
                <input
                  id="pf-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="pf-email">
                  Email
                </label>
                <input
                  id="pf-email"
                  type="email"
                  value={user.email ?? ""}
                  readOnly
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-gray-50 px-4 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="pf-phone">
                  Phone
                </label>
                <input
                  id="pf-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 7XX XXX XXX"
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || !firstName.trim() || !lastName.trim()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Changes
            </button>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-gray-100">Login History</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Recent login activity on your account</p>
            <LoginHistoryTable userId={user.id} />
          </div>
        </div>
      )}

      {/* ── Account Tab ── */}
      {activeTab === "account" && (
        <div className="space-y-4">
          <form onSubmit={handleChangePassword} className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="ac-current-pw">
                  Current Password
                </label>
                <input
                  id="ac-current-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="ac-new-pw">
                  New Password
                </label>
                <input
                  id="ac-new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
                />
                {newPassword && newPassword.length < 8 && (
                  <p className="mt-1 text-xs text-red-500">Minimum 8 characters</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="ac-confirm-pw">
                  Confirm New Password
                </label>
                <input
                  id="ac-confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
            </div>

            {passwordError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle size={15} />
                Password updated successfully
              </div>
            )}

            <button
              type="submit"
              disabled={changingPassword || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {changingPassword ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              Update Password
            </button>
          </form>

          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Two-Factor Authentication</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
            <div className="flex items-center justify-between rounded-lg border border-dashed border-brand-border/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Authenticator app</span>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Not configured
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-400">2FA setup will be available in a future update</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Active Sessions</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Devices and sessions currently logged into your account</p>
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : sessionsError ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-brand-border/20 py-8 text-sm text-gray-400">
                <AlertTriangle size={18} className="mr-2" />
                {sessionsError}
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-brand-border/20 py-8 text-sm text-gray-400">
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
                        ? "border-brand-dark/30 bg-brand-dark/5 dark:border-white/20 dark:bg-white/5"
                        : "border-brand-border/20 dark:border-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Monitor size={18} className="shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {s.device || "Unknown device"}
                          {s.isCurrent && (
                            <span className="ml-2 rounded-full bg-brand-dark/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-dark dark:bg-white/10 dark:text-white">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.browser && `${s.browser} · `}{s.ip && `${s.ip} · `}Last active: {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    {!s.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        disabled={revokingSessionId === s.id}
                        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        {revokingSessionId === s.id ? <Loader2 size={14} className="animate-spin" /> : "Revoke"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Account Activity</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">A log of recent actions performed on your account</p>
            <AccountActivityTable userId={user.id} />
          </div>
        </div>
      )}

      {/* ── Preferences Tab ── */}
      {activeTab === "preferences" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Appearance</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Choose how the platform looks for you</p>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-gray-700 dark:text-gray-300">Toggle light / dark mode</span>
            </div>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Language</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Select your preferred interface language</p>
            <div className="flex items-center gap-4">
              <Globe size={18} className="text-gray-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as keyof typeof UpdateMeDtoPreferredLanguage)}
                className="h-11 max-w-xs rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="rw">Kinyarwanda</option>
              </select>
            </div>
            <button
              onClick={handleSavePreferences}
              disabled={savingLanguage}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {savingLanguage ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Language Preference
            </button>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Notification Preferences</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Control which notifications you receive</p>
            {loadingNotifs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                <label className="flex items-center justify-between rounded-lg border border-brand-border/20 px-4 py-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                    <p className="text-xs text-gray-500">Receive updates via email</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifEmail}
                    onClick={() => setNotifEmail(!notifEmail)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      notifEmail ? "bg-brand-dark dark:bg-white" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifEmail ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between rounded-lg border border-brand-border/20 px-4 py-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">WhatsApp Notifications</p>
                    <p className="text-xs text-gray-500">Receive updates via WhatsApp (Meta Cloud API)</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifWhatsapp}
                    onClick={() => setNotifWhatsapp(!notifWhatsapp)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      notifWhatsapp ? "bg-brand-dark dark:bg-white" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifWhatsapp ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between rounded-lg border border-brand-border/20 px-4 py-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Push Notifications</p>
                    <p className="text-xs text-gray-500">Receive push notifications for booking state changes</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifPush}
                    onClick={() => setNotifPush(!notifPush)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      notifPush ? "bg-brand-dark dark:bg-white" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifPush ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between rounded-lg border border-brand-border/20 px-4 py-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">In-App Notifications</p>
                    <p className="text-xs text-gray-500">Receive notifications inside the platform</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifInApp}
                    onClick={() => setNotifInApp(!notifInApp)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      notifInApp ? "bg-brand-dark dark:bg-white" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifInApp ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </label>
                <button
                  onClick={handleSaveNotifPrefs}
                  disabled={savingNotifs}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
                >
                  {savingNotifs ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save Notification Preferences
                </button>
                {notifsError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    {notifsError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
