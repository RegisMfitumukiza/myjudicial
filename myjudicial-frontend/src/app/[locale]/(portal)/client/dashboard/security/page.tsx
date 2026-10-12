"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Lock,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Smartphone,
  Laptop,
  Shield,
  ShieldCheck,
  Key,
  Loader2,
  LogOut,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader, LoadingSpinner, EmptyState } from "@/shared/components/dashboard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAuth } from "@/providers/auth-provider";

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
  rememberMe?: boolean;
}

function getDeviceIcon(device: string, browser: string) {
  const d = `${device} ${browser}`.toLowerCase();
  if (d.includes("iphone") || d.includes("android") || d.includes("mobile") || d.includes("ipad")) {
    return Smartphone;
  }
  if (d.includes("mac") || d.includes("laptop")) {
    return Laptop;
  }
  return Monitor;
}

export default function ClientSecurityPage() {
  const t = useTranslations("expertDashboard_profile");
  const tChangePassword = useTranslations("expertDashboard_change-password");
  const locale = useLocale();
  const { user } = useAuth();

  /* Password state */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  /* Sessions state */
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingAllOther, setRevokingAllOther] = useState(false);

  /* Fetch sessions */
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const res: any = await apiFetch("/auth/sessions");
      const list = (res.data?.data ?? res.data ?? []) as SessionInfo[];
      setSessions(list);
    } catch {
      setSessionsError(t("failedLoadSessions"));
    } finally {
      setLoadingSessions(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /* Revoke single session */
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await apiFetch(`/auth/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success(t("sessionRevoked"));
    } catch {
      toast.error(t("failedRevokeSession"));
    } finally {
      setRevokingSessionId(null);
    }
  };

  /* Revoke all other sessions */
  const handleRevokeAllOtherSessions = async () => {
    const otherSessions = sessions.filter((s) => !s.isCurrent);
    if (otherSessions.length === 0) return;
    setRevokingAllOther(true);
    try {
      await Promise.all(otherSessions.map((s) => apiFetch(`/auth/sessions/${s.id}`, { method: "DELETE" })));
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("All other active devices signed out.");
    } catch {
      toast.error(t("failedRevokeSession"));
    } finally {
      setRevokingAllOther(false);
    }
  };

  /* Change Password */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError(tChangePassword("errorMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(tChangePassword("errorMismatch"));
      return;
    }

    setChangingPassword(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(tChangePassword("successMessage"));
    } catch (err: unknown) {
      setPasswordError(getErrorMessage(err, tChangePassword("errorDefault")));
    } finally {
      setChangingPassword(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="mx-auto max-w-[900px] space-y-6 p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title="Security & Active Devices"
        description="Manage connected devices, remember me preferences, and protect your account."
        backHref="/client/dashboard/settings"
        backLabel="Settings"
      />

      {/* Account Protection Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">Account Protection</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Your account is registered under <span className="font-medium text-foreground">{user?.email ?? "your email"}</span> and secured with cryptographic session tokens and verification codes.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Email OTP Verification Active
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                Device Binding Protection Enabled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions & Connected Devices */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Monitor size={18} className="text-primary shrink-0" />
              {t("activeSessionsTitle")}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("activeSessionsDesc")}
            </p>
          </div>
          {otherSessionsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAllOtherSessions}
              disabled={revokingAllOther}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto shrink-0"
            >
              {revokingAllOther ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <LogOut size={14} className="mr-1.5" />
              )}
              Sign Out All Other Devices ({otherSessionsCount})
            </Button>
          )}
        </div>

        {loadingSessions ? (
          <LoadingSpinner />
        ) : sessionsError ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
            <AlertTriangle size={18} className="mr-2" />
            <span>{sessionsError}</span>
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState icon={Monitor} title={t("noActiveSessions")} className="py-8" />
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((s) => {
              const DeviceIcon = getDeviceIcon(s.device, s.browser);
              return (
                <div
                  key={s.id}
                  className={`flex flex-col min-[520px]:flex-row min-[520px]:items-center justify-between gap-3 py-3.5 ${
                    s.isCurrent ? "rounded-lg bg-primary/5 px-3 -mx-1" : "px-1"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground mt-0.5 sm:mt-0">
                      <DeviceIcon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium text-foreground break-words flex items-center gap-2 flex-wrap">
                        <span>{s.device || t("unknownDevice")}</span>
                        {s.isCurrent && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary shrink-0">
                            {t("currentBadge")}
                          </span>
                        )}
                        {s.rememberMe ? (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                            Remembered (30d)
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
                            Session Only
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground break-words mt-0.5">
                        {s.browser && `${s.browser} · `}
                        {s.ip && `${s.ip} · `}
                        {t("lastActive")}: {s.lastActive ? new Date(s.lastActive).toLocaleDateString(locale) : t("notAvailable")}
                      </p>
                    </div>
                  </div>
                  {!s.isCurrent && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleRevokeSession(s.id)}
                      disabled={revokingSessionId === s.id}
                      className="w-full min-[520px]:w-auto shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {revokingSessionId === s.id ? <Loader2 size={14} className="animate-spin" /> : t("revokeBtn")}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Password Management */}
      <form onSubmit={handleChangePassword} className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <h3 className="mb-2 text-base font-bold text-foreground flex items-center gap-2">
          <Lock size={18} className="text-primary shrink-0" />
          {tChangePassword("title")}
        </h3>
        <p className="mb-4 text-xs sm:text-sm text-muted-foreground">
          {tChangePassword("subtitle")}
        </p>

        <div className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="client-current-pw">
              {tChangePassword("labelCurrent")}
            </Label>
            <Input
              id="client-current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={tChangePassword("placeholderCurrent")}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-new-pw">
              {tChangePassword("labelNew")}
            </Label>
            <Input
              id="client-new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={tChangePassword("placeholderNew")}
              className="w-full"
            />
            {newPassword && newPassword.length < 8 && (
              <p className="text-xs text-destructive">{tChangePassword("errorMinLength")}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-confirm-pw">
              {tChangePassword("labelConfirm")}
            </Label>
            <Input
              id="client-confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={tChangePassword("placeholderConfirm")}
              className="w-full"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">{tChangePassword("errorMismatch")}</p>
            )}
          </div>
        </div>

        {passwordError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            <CheckCircle size={15} className="text-primary" />
            <span>{tChangePassword("successMessage")}</span>
          </div>
        )}

        <Button
          type="submit"
          className="mt-4 w-full sm:w-auto"
          disabled={changingPassword || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
        >
          {changingPassword ? <Loader2 size={15} className="animate-spin" /> : <Key size={15} />}
          {tChangePassword("submitButton")}
        </Button>
      </form>
    </div>
  );
}
