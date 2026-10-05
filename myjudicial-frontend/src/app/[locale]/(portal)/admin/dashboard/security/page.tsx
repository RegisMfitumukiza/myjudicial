"use client";

import { useEffect, useState, useCallback } from "react";
import { Lock, Globe, CheckCircle, AlertTriangle, Monitor, Key } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
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
        <div key={log.id || idx} className="flex items-center justify-between rounded-lg border border-border px-3 sm:px-4 py-3 min-w-0 gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground capitalize truncate">
              {log.action?.replace(/_/g, " ").toLowerCase()}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {log.entityType && `${log.entityType} · `}{log.createdAt ? new Date(log.createdAt).toLocaleString(locale) : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminSecurityPage() {
  const t = useTranslations("admin.profile");
  const tSidebar = useTranslations("shared.sidebar");
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
    fetchSessions();
  }, [fetchSessions]);

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

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0 max-w-4xl space-y-6">
      <PageHeader
        title={tSidebar("security")}
        description={t("subtitle")}
      />

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Lock size={18} className="text-primary shrink-0" />
            {t("changePassword")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="max-w-md space-y-4">
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground" htmlFor="sec-current-pw">
                  {t("currentPassword")}
                </label>
                <Input
                  id="sec-current-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground" htmlFor="sec-new-pw">
                  {t("newPassword")}
                </label>
                <Input
                  id="sec-new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full"
                />
                {newPassword && newPassword.length < 8 && (
                  <p className="mt-1 text-xs text-destructive">{t("minChars")}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground" htmlFor="sec-confirm-pw">
                  {t("confirmNewPassword")}
                </label>
                <Input
                  id="sec-confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">{t("passwordsNoMatch")}</p>
                )}
              </div>
            </div>

            {passwordError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                <CheckCircle size={15} />
                <span>{t("passwordSuccess")}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={changingPassword || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full sm:w-auto"
            >
              {changingPassword ? (
                <span className="animate-spin">↻</span>
              ) : (
                <Key size={15} />
              )}
              {t("updatePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>


      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Monitor size={18} className="text-primary shrink-0" />
            {t("activeSessions")}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t("activeSessionsDesc")}</CardDescription>
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
                  className={`flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-3 rounded-lg border p-3 sm:px-4 sm:py-3 ${
                    s.isCurrent
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Monitor size={18} className="shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground break-words flex items-center gap-2 flex-wrap">
                        <span>{s.device || "Unknown Device"}</span>
                        {s.isCurrent && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary shrink-0">
                            {t("current")}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground break-words">
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
                      className="self-end min-[480px]:self-auto shrink-0"
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

      {/* Account Activity Audit Trail */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Globe size={18} className="text-primary shrink-0" />
              {t("accountActivity")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t("accountActivityDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountActivityTable userId={user.id} t={t} locale={locale} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
