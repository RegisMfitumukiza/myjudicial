"use client";

import { useEffect, useState, useCallback } from "react";
import { Lock, CheckCircle, AlertTriangle, Monitor, Key, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader, LoadingSpinner, EmptyState } from "@/shared/components/dashboard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

export default function ExpertSecurityPage() {
  const t = useTranslations("expertDashboard_profile");
  const tChangePassword = useTranslations("expertDashboard_change-password");
  const tSidebar = useTranslations("shared.sidebar");
  const locale = useLocale();

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
      setSessionsError(t("failedLoadSessions"));
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
      toast.error(t("failedRevokeSession"));
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
      setPasswordError(tChangePassword("errorMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(tChangePassword("errorMismatch"));
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
      toast.success(tChangePassword("successMessage"));
    } catch (err: unknown) {
      setPasswordError(getErrorMessage(err, tChangePassword("errorDefault")));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0 max-w-4xl space-y-6">
      <PageHeader
        title={tSidebar("security")}
        description={t("profileSubtitle")}
      />

      {/* Password Management */}
      <form onSubmit={handleChangePassword} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-foreground flex items-center gap-2">
          <Lock size={18} className="text-primary shrink-0" />
          {tChangePassword("title")}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {tChangePassword("subtitle")}
        </p>

        <div className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sec-current-pw">
              {tChangePassword("labelCurrent")}
            </Label>
            <Input
              id="sec-current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={tChangePassword("placeholderCurrent")}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sec-new-pw">
              {tChangePassword("labelNew")}
            </Label>
            <Input
              id="sec-new-pw"
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
            <Label htmlFor="sec-confirm-pw">
              {tChangePassword("labelConfirm")}
            </Label>
            <Input
              id="sec-confirm-pw"
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
          {changingPassword ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
          {tChangePassword("submitButton")}
        </Button>
      </form>


      {/* Active Sessions */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        <h3 className="mb-2 text-base font-bold text-foreground flex items-center gap-2">
          <Monitor size={18} className="text-primary shrink-0" />
          {t("activeSessionsTitle")}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("activeSessionsDesc")}
        </p>
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
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-3 py-3 ${
                  s.isCurrent ? "rounded-md bg-primary/5 px-3" : "px-1"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Monitor size={18} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-foreground break-words flex items-center gap-2 flex-wrap">
                      <span>{s.device || t("unknownDevice")}</span>
                      {s.isCurrent && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary shrink-0">
                          {t("currentBadge")}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground break-words">
                      {s.browser && `${s.browser} · `}{s.ip && `${s.ip} · `}
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
                    className="w-full min-[480px]:w-auto shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {revokingSessionId === s.id ? <Loader2 size={14} className="animate-spin" /> : t("revokeBtn")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
