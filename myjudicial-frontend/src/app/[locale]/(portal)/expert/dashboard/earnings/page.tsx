"use client";

import { useState } from "react";
import {
  Wallet,
  Clock,
  ArrowUpRight,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Edit2,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  ExternalLink,
  Calendar,
} from "lucide-react";
import {
  useGetExpertsEarnings,
  useGetExpertsProfileMe,
  usePatchExpertsProfileMe,
  getGetExpertsProfileMeQueryKey,
  getGetExpertsEarningsQueryKey,
} from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";
import {
  PageHeader,
  StatCard,
  ErrorState,
  EmptyState,
} from "@/shared/components/dashboard";
import { StatusBadge } from "@/shared/components/dashboard/status-badge";
import { UserAvatar } from "@/shared/components/expert-avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/routing";

function formatCurrency(amount: number, currency: string, locale: string): string {
  return `${currency} ${amount.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function detectCarrier(raw?: string | null): "MTN" | "AIRTEL" | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (/^(250)?7[89]/.test(digits) || /^07[89]/.test(digits)) return "MTN";
  if (/^(250)?7[23]/.test(digits) || /^07[23]/.test(digits)) return "AIRTEL";
  return null;
}

function CopyChip({
  value,
  displayValue,
  label,
  className = "",
}: {
  value: string;
  displayValue?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(label ? `${label} copied` : "Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className={`group inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/80 max-w-full ${className}`}
      title={`Copy ${label || "value"}: ${value}`}
    >
      <span className="truncate">{displayValue || value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
}

export default function EarningsPage() {
  const t = useTranslations("expertDashboard_earnings");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetExpertsEarnings();
  const { data: profileData, isLoading: isProfileLoading } = useGetExpertsProfileMe();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = usePatchExpertsProfileMe();
  const { isBookingFirst } = usePaymentMode();

  const [activeTab, setActiveTab] = useState<"escrow" | "completed">("escrow");

  const earnings = data?.status === 200 ? data.data.data : null;
  const profile = profileData?.status === 200 ? (profileData.data.data as any) : null;

  const contactPhone: string | null = profile?.user?.phone || null;
  const currentMomo: string | null = profile?.momoNumber || null;

  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [payoutOption, setPayoutOption] = useState<"REGISTERED" | "CUSTOM">("REGISTERED");
  const [customMoMo, setCustomMoMo] = useState("");
  const [momoError, setMomoError] = useState("");

  const customCarrier = detectCarrier(customMoMo);
  const registeredCarrier = detectCarrier(contactPhone);
  const activeCarrier = detectCarrier(currentMomo);

  const pendingEscrowHolds: any[] = (earnings as any)?.pendingEscrowHolds || [];
  const recentTransactions: any[] = earnings?.recentTransactions || [];

  function handleSavePayout(targetNumber?: string) {
    const numberToSave = targetNumber || (payoutOption === "REGISTERED" ? contactPhone : customMoMo.trim());

    if (!numberToSave || !detectCarrier(numberToSave)) {
      setMomoError(t("invalidRwandaMomo"));
      return;
    }

    setMomoError("");
    updateProfile(
      { data: { momoNumber: numberToSave } },
      {
        onSuccess: () => {
          toast.success(t("momoSavedSuccess"));
          setIsEditingPayout(false);
          setCustomMoMo("");
          queryClient.invalidateQueries({ queryKey: getGetExpertsProfileMeQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetExpertsEarningsQueryKey() });
        },
        onError: (err: any) => {
          toast.error(err?.message || t("momoSaveError"));
        },
      }
    );
  }

  function formatDate(iso: string | Date | null): string {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(iso);
    }
  }

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 space-y-6 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        className="shrink-0"
      />

      {isBookingFirst && (
        <Alert variant="warning">
          <AlertCircle />
          <AlertDescription>
            {t("paymentsDisabled")}
          </AlertDescription>
        </Alert>
      )}

      {/* Payout Mobile Money Configuration Card */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
                  {t("payoutSettingsTitle")}
                  {isProfileLoading ? (
                    <Skeleton className="h-5 w-28 rounded-full" />
                  ) : currentMomo ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("verifiedMomo")}
                    </span>
                  ) : contactPhone && registeredCarrier ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="h-3 w-3" />
                      {t("fallbackMomo")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive border border-destructive/20">
                      {t("payoutNotConfigured")}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("payoutSettingsDesc")}
                </p>
              </div>
            </div>

            {isProfileLoading ? (
              <Skeleton className="h-8 w-36 rounded-md self-start sm:self-center" />
            ) : !isEditingPayout && currentMomo ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingPayout(true);
                  setPayoutOption("CUSTOM");
                  setCustomMoMo(currentMomo);
                }}
                className="shrink-0 self-start sm:self-center"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                {t("changePayoutMethod")}
              </Button>
            ) : null}
          </div>

          {/* Active Status Display or Edit Form */}
          {isProfileLoading ? (
            <div className="flex items-center gap-3 bg-muted/40 p-4 rounded-xl border border-border">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ) : !isEditingPayout ? (
            currentMomo ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-background flex items-center justify-center font-bold text-xs border border-border shadow-xs shrink-0">
                    {activeCarrier === "MTN" ? "MTN" : activeCarrier === "AIRTEL" ? "AIR" : "MoMo"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-sm font-semibold text-foreground tracking-wide">
                        {currentMomo}
                      </p>
                      <CopyChip value={currentMomo} label="MoMo Phone" />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <span>{activeCarrier ? `${activeCarrier} Mobile Money Rwanda` : "Rwanda Mobile Money"}</span>
                      {contactPhone && currentMomo === contactPhone && (
                        <span className="text-[10px] text-muted-foreground font-mono">({t("matchesContactPhone")})</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-center shrink-0">
                  <Zap className="h-3 w-3" />
                  {t("autoDisbursement")}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {t("payoutNotConfigured")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("payoutNotConfiguredDesc")}
                      </p>

                      {contactPhone && registeredCarrier && (
                        <div className="pt-2 flex flex-wrap gap-2.5 items-center">
                          <Button
                            size="sm"
                            onClick={() => handleSavePayout(contactPhone)}
                            disabled={isUpdatingProfile}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {isUpdatingProfile ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            {t("confirmRegisteredPhone")} ({contactPhone})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditingPayout(true);
                              setPayoutOption("CUSTOM");
                            }}
                          >
                            {t("useCustomPhone")}
                          </Button>
                        </div>
                      )}
                      {(!contactPhone || !registeredCarrier) && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setIsEditingPayout(true);
                              setPayoutOption("CUSTOM");
                            }}
                          >
                            {t("useCustomPhone")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contactPhone && registeredCarrier && (
                  <label
                    onClick={() => setPayoutOption("REGISTERED")}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      payoutOption === "REGISTERED"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payoutMethod"
                      checked={payoutOption === "REGISTERED"}
                      onChange={() => setPayoutOption("REGISTERED")}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {t("useRegisteredPhone", { phone: contactPhone })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("detectedCarrier")} <strong className="text-foreground">{registeredCarrier} Rwanda</strong>
                      </p>
                    </div>
                  </label>
                )}

                <label
                  onClick={() => setPayoutOption("CUSTOM")}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    payoutOption === "CUSTOM"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/40"
                    }`}
                >
                  <input
                    type="radio"
                    name="payoutMethod"
                    checked={payoutOption === "CUSTOM"}
                    onChange={() => setPayoutOption("CUSTOM")}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {t("useCustomPhone")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("alternateLineDesc")}
                    </p>
                  </div>
                </label>
              </div>

              {payoutOption === "CUSTOM" && (
                <div className="space-y-2 max-w-md pt-1">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="tel"
                        placeholder={t("momoNumberPlaceholder")}
                        value={customMoMo}
                        onChange={(e) => {
                          setCustomMoMo(e.target.value);
                          setMomoError("");
                        }}
                        className="font-mono text-sm"
                      />
                    </div>
                    {customCarrier && (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                          customCarrier === "MTN"
                            ? "bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/30"
                            : "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30"
                        }`}
                      >
                        {customCarrier} MoMo
                      </span>
                    )}
                  </div>
                  {momoError && (
                    <p className="text-xs text-destructive">{momoError}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {t("momoFormatHint")}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleSavePayout()}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  {t("saveCustomPhone")}
                </Button>
                {currentMomo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingPayout(false);
                      setMomoError("");
                    }}
                  >
                    {t("cancel")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 min-[420px]:grid-cols-2 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <Skeleton className="mb-3 h-4 w-28" />
                <Skeleton className="mb-2 h-7 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-5 py-4">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="divide-y border-border">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : isError || !earnings ? (
        <ErrorState
          message={t("failedToLoad")}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-6 min-w-0">
          {/* Responsive Stat Cards: single column on compact phones, 2 on phablets, 3 on tablets/desktops */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 min-[420px]:grid-cols-2 md:grid-cols-3">
            <StatCard
              label={t("netRevenue")}
              value={formatCurrency(earnings.netRevenue, earnings.currency, locale)}
              hint={
                earnings.platformFees > 0
                  ? t("afterFees", { amount: formatCurrency(earnings.platformFees, earnings.currency, locale) })
                  : t("afterNoFees")
              }
              icon={Wallet}
            />
            <StatCard
              label={t("pendingEscrow")}
              value={formatCurrency(earnings.pendingEscrowBalance, earnings.currency, locale)}
              hint={t("heldFromBookings")}
              icon={Clock}
            />
            <StatCard
              label={t("grossRevenue")}
              value={formatCurrency(earnings.grossRevenue, earnings.currency, locale)}
              hint={t("completedBookings", { count: earnings.completedPayouts })}
              icon={ArrowUpRight}
            />
          </div>

          {/* Dual-Tab Ledger Architecture */}
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "escrow" | "completed")}
            >
              <div className="border-b border-border px-4 sm:px-6 pt-3">
                <TabsList variant="line" className="w-full justify-start overflow-x-auto scrollbar-none gap-2">
                  <TabsTrigger value="escrow" className="gap-2">
                    {t("inEscrowTab", { count: pendingEscrowHolds.length })}
                    {pendingEscrowHolds.length > 0 && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {pendingEscrowHolds.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="gap-2">
                    {t("completedPayoutsTab")}
                    {recentTransactions.length > 0 && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {recentTransactions.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: IN ESCROW HOLDS (FUNDS IN CUSTODY) */}
              <TabsContent value="escrow" className="p-4 sm:p-6 space-y-4 m-0">
                {/* Fiduciary Explanatory Banner */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-semibold text-foreground">
                      {t("escrowBanner")}
                    </p>
                  </div>
                </div>

                {pendingEscrowHolds.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title={t("noEscrowHolds")}
                    description={t("noEscrowHoldsDesc")}
                    className="border-0 bg-transparent py-10"
                  />
                ) : (
                  <>
                    {/* Mobile / Small Devices Card Stack (< 768px) */}
                    <div className="divide-y divide-border md:hidden border rounded-xl overflow-hidden bg-card">
                      {pendingEscrowHolds.map((hold) => (
                        <div key={hold.bookingId} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar
                                src={hold.citizenAvatarUrl}
                                name={hold.citizenName || "Client"}
                                size="xs"
                                className="h-8 w-8 text-xs shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {hold.citizenName || "Client"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{hold.serviceName}</p>
                              </div>
                            </div>
                            <StatusBadge tone="pending">
                              {t("statusLocked")}
                            </StatusBadge>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{formatDate(hold.scheduledStart)}</span>
                            </div>
                            <div className="font-bold text-foreground tabular-nums">
                              {formatCurrency(hold.amount, hold.currency, locale)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                            <CopyChip value={hold.bookingId} displayValue={`${hold.bookingId.slice(0, 10)}...`} label="Booking ID" />
                            <Link
                              href={`/expert/dashboard/bookings/${hold.bookingId}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <span>{t("viewBooking")}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tablet & Desktop Data Table (>= 768px) */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="px-5 py-3.5">{t("booking")}</th>
                            <th className="px-5 py-3.5">{t("client")}</th>
                            <th className="px-5 py-3.5">{t("service")}</th>
                            <th className="px-5 py-3.5">{t("scheduled")}</th>
                            <th className="px-5 py-3.5">{t("guaranteedPayout")}</th>
                            <th className="px-5 py-3.5 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {pendingEscrowHolds.map((hold) => (
                            <tr key={hold.bookingId} className="transition-colors hover:bg-muted/40">
                              <td className="px-5 py-3.5">
                                <CopyChip
                                  value={hold.bookingId}
                                  displayValue={`${hold.bookingId.slice(0, 8)}...`}
                                  label="Booking ID"
                                />
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <UserAvatar
                                    src={hold.citizenAvatarUrl}
                                    name={hold.citizenName || "Client"}
                                    size="xs"
                                    className="h-7 w-7 text-xs shrink-0"
                                  />
                                  <span className="font-medium text-foreground truncate">
                                    {hold.citizenName || "Client"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground">
                                {hold.serviceName}
                              </td>
                              <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  <span>{formatDate(hold.scheduledStart)}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="font-bold tabular-nums text-foreground">
                                  {formatCurrency(hold.amount, hold.currency, locale)}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <Link
                                  href={`/expert/dashboard/bookings/${hold.bookingId}`}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                  <span>{t("viewBooking")}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* TAB 2: COMPLETED PAYOUTS */}
              <TabsContent value="completed" className="p-4 sm:p-6 space-y-4 m-0">
                {recentTransactions.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title={t("noTransactions")}
                    className="border-0 bg-transparent py-10"
                  />
                ) : (
                  <>
                    {/* Mobile / Small Devices Card Stack (< 768px) */}
                    <div className="divide-y divide-border md:hidden border rounded-xl overflow-hidden bg-card">
                      {recentTransactions.map((tx) => (
                        <div key={tx.bookingId} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar
                                src={tx.citizenAvatarUrl}
                                name={tx.citizenName || "Client"}
                                size="xs"
                                className="h-8 w-8 text-xs shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {tx.citizenName || "Client"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{tx.serviceName}</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              {t("statusDisbursed")}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                            <span className="text-muted-foreground">{formatDate(tx.completedAt)}</span>
                            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(tx.amount, tx.currency, locale)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                            <CopyChip value={tx.bookingId} displayValue={`${tx.bookingId.slice(0, 10)}...`} label="Booking ID" />
                            <Link
                              href={`/expert/dashboard/bookings/${tx.bookingId}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <span>{t("viewBooking")}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tablet & Desktop Data Table (>= 768px) */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="px-5 py-3.5">{t("booking")}</th>
                            <th className="px-5 py-3.5">{t("client")}</th>
                            <th className="px-5 py-3.5">{t("service")}</th>
                            <th className="px-5 py-3.5">{t("amount")}</th>
                            <th className="px-5 py-3.5">{t("completed")}</th>
                            <th className="px-5 py-3.5 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {recentTransactions.map((tx) => (
                            <tr key={tx.bookingId} className="transition-colors hover:bg-muted/40">
                              <td className="px-5 py-3.5">
                                <CopyChip
                                  value={tx.bookingId}
                                  displayValue={`${tx.bookingId.slice(0, 8)}...`}
                                  label="Booking ID"
                                />
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <UserAvatar
                                    src={tx.citizenAvatarUrl}
                                    name={tx.citizenName || "Client"}
                                    size="xs"
                                    className="h-7 w-7 text-xs shrink-0"
                                  />
                                  <span className="font-medium text-foreground truncate">
                                    {tx.citizenName || "Client"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground">
                                {tx.serviceName}
                              </td>
                              <td className="px-5 py-3.5 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                +{formatCurrency(tx.amount, tx.currency, locale)}
                              </td>
                              <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                {formatDate(tx.completedAt)}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <Link
                                  href={`/expert/dashboard/bookings/${tx.bookingId}`}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                  <span>{t("viewBooking")}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}
    </div>
  );
}
