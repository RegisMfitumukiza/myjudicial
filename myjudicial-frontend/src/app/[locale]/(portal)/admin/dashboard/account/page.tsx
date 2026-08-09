"use client";

import { useEffect, useState, useCallback } from "react";
import { Lock, Smartphone, Monitor, Loader2, AlertTriangle, CheckCircle, Key, Palette } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { apiFetch } from "@/lib/api/client";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { toast } from "sonner";


type TabId = "security" | "preferences";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "security", label: "Security", icon: Lock },
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

export default function AdminAccountPage() {
  const { user } = useAuth();


  const [activeTab, setActiveTab] = useState<TabId>("security");

  /* Security tab state - Password change */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  /* Security tab state - Active sessions */
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  /* Preferences tab state */
  const [language, setLanguage] = useState<"en" | "fr" | "rw">("en");
  const [savingLanguage, setSavingLanguage] = useState(false);

  /* Sync user preferences */
  useEffect(() => {
    if (user) {
      setLanguage((user.preferredLanguage as "en" | "fr" | "rw") ?? "en");
    }
  }, [user]);

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
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch (err: any) {
      setPasswordError(err?.message ?? "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  /* ── Fetch active sessions ── */
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
    if (activeTab === "security") {
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

  /* ── Save preferences ── */
  const handleSavePreferences = async () => {
    setSavingLanguage(true);
    try {
      await apiFetch("/auth/me", { method: "PATCH", body: { preferredLanguage: language } });
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSavingLanguage(false);
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Account Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your account security and platform preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-brand-border/20 bg-white p-1 shadow-md dark:bg-gray-900">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
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

      {/* ── Security Tab ── */}
      {activeTab === "security" && (
        <div className="space-y-4">
          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="current-pw">
                  Current Password
                </label>
                <input
                  id="current-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="new-pw">
                  New Password
                </label>
                <input
                  id="new-pw"
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="confirm-pw">
                  Confirm New Password
                </label>
                <input
                  id="confirm-pw"
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

          {/* Two-Factor Authentication */}
          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Two-Factor Authentication</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your admin account</p>
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

          {/* Active Sessions */}
          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Active Sessions</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Devices currently logged into your admin account</p>
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
        </div>
      )}

      {/* ── Preferences Tab ── */}
      {activeTab === "preferences" && (
        <div className="space-y-4">
          {/* Appearance */}
          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Appearance</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Choose how the platform looks for you</p>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-gray-700 dark:text-gray-300">Toggle light / dark mode</span>
            </div>
          </div>

          {/* Language */}
          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Language</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Select your preferred interface language</p>
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "fr" | "rw")}
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
              {savingLanguage ? <Loader2 size={15} className="animate-spin" /> : <Key size={15} />}
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
