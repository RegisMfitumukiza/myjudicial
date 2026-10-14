"use client";

import { useState } from "react";
import {
  Wallet,
  Clock,
  ArrowUpRight,
  AlertCircle,
  Phone,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Edit2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  useGetExpertsEarnings,
  useGetExpertsProfileMe,
  usePatchExpertsProfileMe,
} from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";
import {
  PageHeader,
  StatCard,
  ErrorState,
  EmptyState,
} from "@/shared/components/dashboard";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function detectCarrier(raw?: string | null): "MTN" | "AIRTEL" | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (/^(250)?7[89]/.test(digits) || /^07[89]/.test(digits)) return "MTN";
  if (/^(250)?7[23]/.test(digits) || /^07[23]/.test(digits)) return "AIRTEL";
  return null;
}

export default function EarningsPage() {
  const t = useTranslations("expertDashboard_earnings");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetExpertsEarnings();
  const { data: profileData, isLoading: isProfileLoading } = useGetExpertsProfileMe();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = usePatchExpertsProfileMe();
  const { isBookingFirst } = usePaymentMode();

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
          queryClient.invalidateQueries();
        },
        onError: (err: any) => {
          toast.error(err?.message || t("momoSaveError"));
        },
      }
    );
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "-";
    return new Date(iso).toLocaleString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  {t("payoutSettingsTitle")}
                  {currentMomo ? (
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

            {!isEditingPayout && currentMomo && (
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
            )}
          </div>

          {/* Active Status Display or Edit Form */}
          {!isEditingPayout ? (
            currentMomo ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-background flex items-center justify-center font-bold text-xs border border-border shadow-xs">
                    {activeCarrier === "MTN" ? "MTN" : activeCarrier === "AIRTEL" ? "AIR" : "MoMo"}
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold text-foreground tracking-wide">
                      {currentMomo}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span>{activeCarrier ? `${activeCarrier} Mobile Money Rwanda` : "Rwanda Mobile Money"}</span>
                      {contactPhone && currentMomo === contactPhone && (
                        <span className="text-[10px] text-muted-foreground font-mono">(Matches contact phone)</span>
                      )}
                    </p>
                  </div>
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
                        Detected carrier: <strong className="text-foreground">{registeredCarrier} Rwanda</strong>
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
                      Specify an alternate MTN or Airtel line or office account
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
                    Must start with 078, 079 (MTN) or 072, 073 (Airtel).
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
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          {/* stat card skeletons */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 min-[420px]:grid-cols-2 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <Skeleton className="mb-3 h-4 w-28" />
                <Skeleton className="mb-2 h-7 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
          {/* transaction table skeleton */}
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
          <div className="grid grid-cols-1 gap-3 sm:gap-4 min-[420px]:grid-cols-2 md:grid-cols-3">
            <StatCard
              label={t("netRevenue")}
              value={formatCurrency(earnings.netRevenue, earnings.currency)}
              hint={
                earnings.platformFees > 0
                  ? t("afterFees", { amount: formatCurrency(earnings.platformFees, earnings.currency) })
                  : t("afterNoFees")
              }
              icon={Wallet}
            />
            <StatCard
              label={t("pendingEscrow")}
              value={formatCurrency(earnings.pendingEscrowBalance, earnings.currency)}
              hint={t("heldFromBookings")}
              icon={Clock}
            />
            <StatCard
              label={t("grossRevenue")}
              value={formatCurrency(earnings.grossRevenue, earnings.currency)}
              hint={t("completedBookings", { count: earnings.completedPayouts })}
              icon={ArrowUpRight}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">{t("recentTransactions")}</h2>
            </div>
            {earnings.recentTransactions.length === 0 ? (
              <EmptyState
                icon={Clock}
                title={t("noTransactions")}
                className="border-0 bg-transparent"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3">{t("booking")}</th>
                      <th className="px-5 py-3">{t("service")}</th>
                      <th className="px-5 py-3">{t("amount")}</th>
                      <th className="px-5 py-3">{t("completed")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {earnings.recentTransactions.map((tx) => (
                      <tr key={tx.bookingId} className="text-sm transition-colors hover:bg-muted/50">
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                          {tx.bookingId.slice(0, 8)}...
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{tx.serviceName}</td>
                        <td className="px-5 py-3 font-medium tabular-nums text-primary">
                          +{formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {formatDate(tx.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
