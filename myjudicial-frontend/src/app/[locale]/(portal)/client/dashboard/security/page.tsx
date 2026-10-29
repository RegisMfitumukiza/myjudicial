"use client";

import { useState, useMemo } from "react";
import {
  Lock,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Smartphone,
  Laptop,
  ShieldCheck,
  Key,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  Download,
  FileCheck2,
  Check,
  Globe,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader, SkeletonList, EmptyState } from "@/shared/components/dashboard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

interface SessionsApiResponse {
  data?: {
    data?: SessionInfo[];
  } | SessionInfo[];
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
  const t = useTranslations("clientDashboard_security");
  const locale = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /* Password state */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  /* Password strength evaluation */
  const passwordCriteria = useMemo(() => {
    const hasMinLength = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialOrUpper = /[A-Z]|[^A-Za-z0-9]/.test(newPassword);
    const score = (hasMinLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecialOrUpper ? 1 : 0);
    return {
      hasMinLength,
      hasNumber,
      hasSpecialOrUpper,
      score, // 0 to 3
    };
  }, [newPassword]);

  /* Revocation states */
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingAllOther, setRevokingAllOther] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  /* Clean IP address display */
  const cleanIp = (ip: string) => {
    if (!ip) return "—";
    const cleaned = ip.replace(/^::ffff:/, "");
    const isLocal =
      cleaned === "127.0.0.1" ||
      cleaned === "::1" ||
      cleaned.startsWith("172.") ||
      cleaned.startsWith("192.168.") ||
      cleaned.startsWith("10.");
    return isLocal ? `${cleaned} (${t("localNetwork")})` : cleaned;
  };

  /* Relative time formatter: "2h ago", "3d ago", "just now" */
  function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  }

  /* Fetch active sessions using TanStack Query */
  const {
    data: sessions = [],
    isLoading: loadingSessions,
    isError: hasSessionsError,
  } = useQuery<SessionInfo[]>({
    queryKey: ["auth-sessions"],
    queryFn: async () => {
      const res = (await apiFetch("/auth/sessions")) as SessionsApiResponse;
      if (res.data && Array.isArray((res.data as { data?: SessionInfo[] }).data)) {
        return (res.data as { data: SessionInfo[] }).data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    },
    staleTime: 30_000,
  });

  /* Revoke single session */
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await apiFetch(`/auth/sessions/${sessionId}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
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
      await queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
      toast.success(t("allOtherSignedOut"));
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
      setPasswordError(t("errorMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("errorMismatch"));
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
      toast.success(t("successMessage"));
    } catch (err: unknown) {
      setPasswordError(getErrorMessage(err, t("errorDefault")));
    } finally {
      setChangingPassword(false);
    }
  };

  /* Export Personal Data Archive (Rwanda Law Nº 058/2021) */
  const handleExportData = () => {
    setExportingData(true);
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        jurisdiction: "Republic of Rwanda",
        lawReference: "Law Nº 058/2021 relating to the protection of personal data and privacy",
        account: {
          id: user?.id,
          email: user?.email,
          fullName: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
          phone: user?.phone ?? null,
          role: user?.role,
          activeSessionsCount: sessions.length,
        },
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `myjudicial-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success(t("dataExported"));
    } catch {
      toast.error("Failed to generate data export");
    } finally {
      setExportingData(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="mx-auto max-w-[900px] space-y-6 p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        backHref="/client/dashboard/settings"
        backLabel={t("backToSettings")}
      />

      {/* Account Protection Card */}
      <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
            <ShieldCheck size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-brand-dark dark:text-white">
              {t("accountProtection")}
            </h2>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-brand-dark/70 dark:text-white/70">
              {t("accountProtectionDesc", { email: user?.email ?? "your email" })}
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {t("emailOtpActive")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-300">
                <Globe size={12} className="text-blue-600 dark:text-blue-400" />
                {t("deviceBindingActive")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions & Connected Devices */}
      <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 pb-3 border-b border-brand-border/10 dark:border-white/10">
          <div>
            <h3 className="text-[15px] font-bold text-brand-dark dark:text-white flex items-center gap-2">
              <Monitor size={18} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("activeSessionsTitle")}</span>
            </h3>
            <p className="mt-0.5 text-xs text-brand-dark/60 dark:text-white/60">
              {t("activeSessionsDesc")}
            </p>
          </div>
          {otherSessionsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAllOtherSessions}
              disabled={revokingAllOther}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30 w-full sm:w-auto shrink-0 font-semibold"
            >
              {revokingAllOther ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <LogOut size={14} className="mr-1.5" />
              )}
              {t("signOutAllOther", { count: otherSessionsCount })}
            </Button>
          )}
        </div>

        {loadingSessions ? (
          <SkeletonList count={2} itemClassName="h-16 rounded-xl" />
        ) : hasSessionsError ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-brand-border/30 py-8 text-sm text-brand-dark/60 dark:text-white/60">
            <AlertTriangle size={18} className="mr-2 text-amber-500" />
            <span>{t("failedLoadSessions")}</span>
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState icon={Monitor} title={t("noActiveSessions")} className="py-8" />
        ) : (
          <div className="divide-y divide-brand-border/10 dark:divide-white/10">
            {sessions.map((s) => {
              const DeviceIcon = getDeviceIcon(s.device, s.browser);
              return (
                <div
                  key={s.id}
                  className={`flex flex-col min-[560px]:flex-row min-[560px]:items-center justify-between gap-3 py-3.5 transition-colors ${
                    s.isCurrent
                      ? "rounded-xl bg-brand-dark/[0.03] dark:bg-white/[0.03] px-3.5 -mx-1"
                      : "px-1"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/5 dark:bg-white/10 text-brand-dark dark:text-white mt-0.5 sm:mt-0">
                      <DeviceIcon size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-[13px] font-bold text-brand-dark dark:text-white break-words flex items-center gap-2 flex-wrap">
                        <span>{s.device || "Desktop Device"}</span>
                        {s.isCurrent && (
                          <span className="rounded-full bg-brand-dark text-white dark:bg-white dark:text-black px-2 py-0.5 text-[10px] font-bold uppercase shrink-0">
                            {t("currentDevice")}
                          </span>
                        )}
                        {s.rememberMe ? (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0">
                            {t("remembered30d")}
                          </span>
                        ) : (
                          <span className="rounded-full bg-brand-dark/5 border border-brand-border/20 px-2 py-0.5 text-[10px] font-medium text-brand-dark/60 dark:text-white/60 shrink-0">
                            {t("sessionOnly")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-dark/60 dark:text-white/60 break-words mt-1">
                        {s.browser && `${s.browser} · `}
                        {cleanIp(s.ip)} · {t("lastActive")}:{" "}
                        {s.lastActive ? formatRelativeTime(s.lastActive) : "—"}
                      </p>
                      {s.createdAt && (
                        <p className="text-[10px] text-brand-dark/40 dark:text-white/40 mt-0.5">
                          {t("sessionStarted")}: {new Date(s.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                  {!s.isCurrent && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleRevokeSession(s.id)}
                      disabled={revokingSessionId === s.id}
                      className="w-full min-[560px]:w-auto shrink-0 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-900/40 dark:text-red-400 font-semibold"
                    >
                      {revokingSessionId === s.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        t("revokeBtn")
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Change Password with Industrial Strength Meter & Visibility Toggles */}
      <form
        onSubmit={handleChangePassword}
        className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Lock size={18} className="text-brand-dark dark:text-white shrink-0" />
          <h3 className="text-[15px] sm:text-[16px] font-bold text-brand-dark dark:text-white">
            {t("changePasswordTitle")}
          </h3>
        </div>
        <p className="mb-5 text-xs sm:text-sm text-brand-dark/60 dark:text-white/60 leading-relaxed">
          {t("changePasswordDesc")}
        </p>

        <div className="max-w-lg space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <Label htmlFor="client-current-pw" className="text-xs font-bold text-brand-dark dark:text-white">
              {t("labelCurrent")}
            </Label>
            <div className="relative">
              <Input
                id="client-current-pw"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("placeholderCurrent")}
                className="w-full pr-10 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 hover:text-brand-dark dark:text-white/40 dark:hover:text-white"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="client-new-pw" className="text-xs font-bold text-brand-dark dark:text-white">
              {t("labelNew")}
            </Label>
            <div className="relative">
              <Input
                id="client-new-pw"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("placeholderNew")}
                className="w-full pr-10 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 hover:text-brand-dark dark:text-white/40 dark:hover:text-white"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Dynamic Password Strength Bar */}
            {newPassword.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-brand-dark/60 dark:text-white/60">{t("strengthLabel")}:</span>
                  <span
                    className={`font-bold ${
                      passwordCriteria.score === 3
                        ? "text-emerald-600 dark:text-emerald-400"
                        : passwordCriteria.score === 2
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-500"
                    }`}
                  >
                    {passwordCriteria.score === 3
                      ? t("strong")
                      : passwordCriteria.score === 2
                      ? t("fair")
                      : t("weak")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full bg-brand-dark/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      passwordCriteria.score >= 1 ? "bg-red-500" : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      passwordCriteria.score >= 2 ? "bg-amber-500" : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      passwordCriteria.score >= 3 ? "bg-emerald-500" : "bg-transparent"
                    }`}
                  />
                </div>

                {/* Criteria Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {passwordCriteria.hasMinLength ? (
                      <Check size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-dark/30 dark:bg-white/30 shrink-0" />
                    )}
                    <span
                      className={
                        passwordCriteria.hasMinLength
                          ? "text-emerald-700 dark:text-emerald-400 font-medium"
                          : "text-brand-dark/50 dark:text-white/50"
                      }
                    >
                      {t("reqLength")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordCriteria.hasNumber ? (
                      <Check size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-dark/30 dark:bg-white/30 shrink-0" />
                    )}
                    <span
                      className={
                        passwordCriteria.hasNumber
                          ? "text-emerald-700 dark:text-emerald-400 font-medium"
                          : "text-brand-dark/50 dark:text-white/50"
                      }
                    >
                      {t("reqNumber")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    {passwordCriteria.hasSpecialOrUpper ? (
                      <Check size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-dark/30 dark:bg-white/30 shrink-0" />
                    )}
                    <span
                      className={
                        passwordCriteria.hasSpecialOrUpper
                          ? "text-emerald-700 dark:text-emerald-400 font-medium"
                          : "text-brand-dark/50 dark:text-white/50"
                      }
                    >
                      {t("reqSpecial")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="client-confirm-pw" className="text-xs font-bold text-brand-dark dark:text-white">
              {t("labelConfirm")}
            </Label>
            <div className="relative">
              <Input
                id="client-confirm-pw"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("placeholderConfirm")}
                className="w-full pr-10 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 hover:text-brand-dark dark:text-white/40 dark:hover:text-white"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{t("errorMismatch")}</p>
            )}
          </div>
        </div>

        {passwordError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{t("successMessage")}</span>
          </div>
        )}

        <Button
          type="submit"
          className="mt-5 w-full sm:w-auto font-bold rounded-xl"
          disabled={
            changingPassword ||
            !currentPassword ||
            newPassword.length < 8 ||
            newPassword !== confirmPassword
          }
        >
          {changingPassword ? (
            <Loader2 size={15} className="mr-1.5 animate-spin" />
          ) : (
            <Key size={15} className="mr-1.5" />
          )}
          {changingPassword ? t("updatingButton") : t("submitButton")}
        </Button>
      </form>

      {/* Rwanda Law Nº 058/2021 Data Protection & Privacy Compliance Card */}
      <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
              <FileCheck2 size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-bold text-brand-dark dark:text-white">
                  {t("dataProtectionTitle")}
                </h3>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {t("dataProtectionBadge")}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-brand-dark/70 dark:text-white/70">
                {t("dataProtectionDesc")}
              </p>
              <p className="mt-0.5 text-xs text-brand-dark/50 dark:text-white/50">
                {t("exportDataDesc")}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={exportingData}
            className="shrink-0 w-full sm:w-auto font-semibold rounded-xl border-brand-border/30 hover:bg-brand-dark/[0.04] dark:border-white/15 dark:hover:bg-white/10"
          >
            {exportingData ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Download size={14} className="mr-1.5" />
            )}
            {t("exportDataBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
}
