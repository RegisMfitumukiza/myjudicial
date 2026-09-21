"use client";

import { useState, useEffect, use, useMemo, Suspense } from "react";
import { Link } from "@/i18n/routing";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  ArrowRight, CheckCircle, MessageSquare,
  ShieldCheck, Lock, Info, Coins, Smartphone, Loader2,
  AlertCircle, Search,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useGetExpertsIdProfile, useGetExpertsExpertIdServices } from "@/api/generated";
import { useAvailableSlots } from "@/features/booking/hooks/useAvailableSlots";
import { useCreateBooking } from "@/features/booking/hooks/useCreateBooking";
import { useRequireBookingAuth } from "@/features/booking/hooks/useRequireBookingAuth";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";
import { ExpertInfoHeader } from "@/features/search/components/expert-info-header";
import { ServiceCard } from "@/features/booking/components/service-card";
import { BookingSummaryCard } from "@/features/booking/components/booking-summary-card";
import { TimeSlotList } from "@/features/booking/components/time-slot-list";
import { PaymentForm } from "@/features/booking/components/payment-form";
import { TimeZonePicker } from "@/features/booking/components/timezone-picker";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { LegalService } from "@/api/generated";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function formatDateToParam(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/* ── Skeleton loader matching the booking page two-column layout ── */
function BookingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                {i === 2 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 animate-pulse rounded-xl bg-muted" />
                    <div className="h-20 animate-pulse rounded-xl bg-muted" />
                  </div>
                )}
                {i === 3 && (
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 14 }).map((_, j) => (
                      <div key={j} className="h-9 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="h-5 w-40 animate-pulse rounded bg-muted mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-muted mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Error state for unavailable expert ── */
function BookingError({ t, tCommon }: { t: ReturnType<typeof useTranslations>; tCommon: ReturnType<typeof useTranslations> }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{t("expertUnavailable")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("expertUnavailableDesc")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" className="rounded-xl border-border text-sm">
            <Link href="/search">
              <Search size={14} className="mr-1.5" />
              {t("findSimilarLawyers")}
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-brand-dark text-sm text-on-brand hover:bg-brand-dark/90">
            <Link href="/search">{t("backToSearch")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function BookingContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedServiceId = searchParams.get("serviceId");
  const { requireAuth, status: authStatus } = useRequireBookingAuth();
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const { isBookingFirst, isLoading: paymentModeLoading } = usePaymentMode();

  /* ── Auth gate: redirect unauthenticated users immediately ── */
  useEffect(() => {
    if (authStatus === "loading") return;
    requireAuth(pathname);
  }, [authStatus, pathname]);

  const { data: expertProfile, isLoading: profileLoading, error: profileError } = useGetExpertsIdProfile(id);
  const { mutate: createBooking, isPending: isCreatingBooking } = useCreateBooking();

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [paymentMNO, setPaymentMNO] = useState("MTN");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [timezone, setTimezone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mj_timezone") || "Africa/Kigali";
    }
    return "Africa/Kigali";
  });

  const servicesResult = useGetExpertsExpertIdServices(id);
  const services: LegalService[] = (servicesResult.data as { data?: { data?: LegalService[] } } | undefined)?.data?.data ?? [];
  const activeService = services.find((s) => s.id === selectedService) ?? null;

  const dateParam = selectedDate ? formatDateToParam(year, month, selectedDate) : undefined;
  const { slots, isLoading: slotsLoading } = useAvailableSlots(id, dateParam, activeService?.id);

  const serviceFee = activeService ? activeService.flatFee : 0;
  const canSubmit = selectedDate !== null && selectedSlot !== null && activeService !== null;

  useEffect(() => {
    if (services.length === 0) return;
    if (requestedServiceId && services.some((s) => s.id === requestedServiceId)) {
      if (selectedService !== requestedServiceId) {
        setSelectedService(requestedServiceId);
      }
    } else if (!selectedService) {
      setSelectedService(services[0].id);
    }
  }, [services, requestedServiceId, selectedService]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function handleRequest() {
    if (!selectedSlot || !activeService || !id) return;

    const isPaymentRequired = !isBookingFirst;
    if (isPaymentRequired && (!paymentPhone || paymentPhone.length < 9)) {
      toast.error(t("invalidPhoneNumber"));
      return;
    }

    createBooking({
      expertId: id,
      serviceId: activeService.id,
      scheduledStart: selectedSlot.start,
      scheduledEnd: selectedSlot.end,
      citizenNotes: reason || undefined,
      ...(isPaymentRequired
        ? { paymentMNO, paymentPhoneNumber: paymentPhone }
        : {}),
    }, {
      onSuccess: (data) => {
        setCreatedBookingId(data.booking.id);
        setConfirmed(true);
        if (!isBookingFirst && data.payment?.paymentLink) {
          window.location.href = data.payment.paymentLink;
        }
      },
      onError: (error: Error) => {
        toast.error(`${t("bookingFailed")}: ${error.message}`);
      },
    });
  }

  /* ── Show nothing while auth is resolving — the redirect is imminent ── */
  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return <BookingSkeleton />;
  }

  /* ── Loading: show skeleton, never a blank spinner page ── */
  if (profileLoading || servicesResult.isLoading || paymentModeLoading) {
    return <BookingSkeleton />;
  }

  /* ── Error: friendly unavailability state ── */
  if (profileError || !expertProfile) {
    return <BookingError t={t} tCommon={tCommon} />;
  }

  const profile = (expertProfile as unknown as { data: { data: { id: string; displayName: string; bio?: string; primarySpecialty?: string; avgRating?: number; totalBookings?: number; baseConsultationFee?: number; profileImageUrl?: string; officeAddress?: string; yearsExperience?: number; city?: string; languages?: string[]; verified?: boolean } } }).data.data;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  return (
    <div className="min-h-screen bg-background">
      {!confirmed ? (
        <>
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

              {/* LEFT */}
              <div className="space-y-6">

                {/* 1. EXPERT INFORMATION */}
                <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-on-brand">1</span>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("expertInformation")}</h2>
                  </div>
                  <ExpertInfoHeader
                    displayName={profile.displayName}
                    primarySpecialty={profile.primarySpecialty ?? null}
                    avatarUrl={profile.profileImageUrl ?? null}
                    verified={profile.verified ?? false}
                    avgRating={profile.avgRating ?? null}
                    totalBookings={profile.totalBookings ?? 0}
                    officeAddress={profile.officeAddress ?? null}
                    yearsExperience={profile.yearsExperience ?? null}
                    showTimezone
                  />
                </section>

                {/* 2. SERVICE TYPE */}
                {services.length > 0 && (
                  <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-on-brand">2</span>
                      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("selectServiceType")}</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {services.map((svc) => (
                        <ServiceCard
                          key={svc.id}
                          service={{
                            id: svc.id,
                            name: svc.name,
                            description: svc.description ?? undefined,
                            category: svc.category ?? undefined,
                            deliveryMode: svc.deliveryMode ?? undefined,
                            durationMin: svc.durationMin,
                            flatFee: svc.flatFee,
                            currency: svc.currency ?? undefined,
                          }}
                          isSelected={selectedService === svc.id}
                          onSelect={(s) => {
                            setSelectedService(s.id);
                            setSelectedTime(null);
                            setSelectedSlot(null);
                          }}
                          layout="grid"
                          showArrow={false}
                          expertName={profile.displayName}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. CHOOSE DATE & TIME */}
                <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-on-brand">
                      {activeService ? "3" : services.length > 0 ? "3" : "2"}
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("date")} & {t("time")}</h2>
                  </div>

                  {activeService?.deliveryMode === "IN_PERSON" ? (
                    <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-300">
                      {t("inPersonSlotHint")}
                    </div>
                  ) : (activeService?.deliveryMode === "EMAIL" || activeService?.category === "document_review") ? (
                    <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-300">
                      {t("documentSlotHint")}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_220px]">
                    {/* Calendar */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          <CalendarIcon className="h-4 w-4 text-foreground" />
                          {t("selectConsultDate")} — {t(`months.${MONTH_KEYS[month]}`)} {year}
                        </p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={prevMonth}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={nextMonth}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-1.5 grid grid-cols-7 text-center">
                        {DAY_KEYS.map((k) => (
                          <div key={k} className="py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            {t(`days.${k}`)}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1.5">
                        {Array.from({ length: firstDay }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const isToday =
                            day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                          const isSel = selectedDate === day;
                          const isPast =
                            new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={isPast}
                              onClick={() => { setSelectedDate(day); setSelectedTime(null); setSelectedSlot(null); }}
                              className={`flex h-9 w-full items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                                isPast
                                  ? "cursor-not-allowed text-muted-foreground/40"
                                  : isSel
                                  ? "bg-brand-dark font-bold text-on-brand"
                                  : isToday
                                  ? "border-2 border-brand-dark font-bold text-foreground"
                                  : "text-foreground hover:bg-muted"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          {t("availableSlots")}
                        </p>
                        <TimeZonePicker
                          value={timezone}
                          onChange={(tz) => {
                            setTimezone(tz);
                            localStorage.setItem("mj_timezone", tz);
                          }}
                        />
                      </div>
                      <TimeSlotList
                        slots={slots}
                        selectedSlot={selectedSlot}
                        onSelect={(slot) => {
                          const date = new Date(slot.start);
                          const timeStr = timezone
                            ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone })
                            : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                          setSelectedTime(timeStr);
                          setSelectedSlot(slot);
                        }}
                        isLoading={slotsLoading}
                        layout="list"
                        timezone={timezone}
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mt-6 border-t border-border pt-5">
                    <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <MessageSquare className="h-4 w-4 text-foreground" />
                      {t("reason")} ({t("optional")})
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t("describeIssue")}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-dark"
                    />
                  </div>
                </section>

                {/* Trust badges */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { icon: ShieldCheck, title: t("verifiedProfessional"), desc: t("verifiedProfessionalDesc") },
                    { icon: Coins, title: t("fairPricing"), desc: t("fairPricingDesc") },
                    { icon: Smartphone, title: t("instantAccess"), desc: t("instantAccessDesc") },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div
                      key={title}
                      className="rounded-xl border border-border bg-card p-4 text-center shadow-sm"
                    >
                      <Icon className="mx-auto mb-2 h-5 w-5 text-foreground" />
                      <p className="text-sm font-bold text-foreground">{title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Booking Summary */}
              <aside className="h-fit space-y-4 lg:sticky lg:top-24">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <BookingSummaryCard
                    data={{
                      expertName: profile.displayName,
                      serviceName: activeService?.name ?? t("notSelected"),
                      date: selectedDate ? new Date(year, month, selectedDate) : undefined,
                      slotStart: selectedSlot?.start,
                      durationMin: activeService?.durationMin,
                      currency: activeService?.currency,
                      flatFee: serviceFee,
                      deliveryMode: activeService?.deliveryMode ?? undefined,
                    }}
                    showDeliveryMode
                    compact
                  />

                  {!isBookingFirst && canSubmit && (
                    <div className="mt-4 border-t border-border pt-4">
                      <PaymentForm
                        paymentMNO={paymentMNO}
                        paymentPhone={paymentPhone}
                        onMNOChange={setPaymentMNO}
                        onPhoneChange={setPaymentPhone}
                        showLabel={false}
                        compact
                      />
                    </div>
                  )}

                  {!isBookingFirst && (
                    <div className="mt-4 flex gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <p>
                        <span className="font-semibold text-foreground">{t("securedByEscrow")}</span> {t("paymentHeldSafely")}
                      </p>
                    </div>
                  )}

                  <Button
                    disabled={!canSubmit || isCreatingBooking}
                    onClick={handleRequest}
                    className="mt-5 h-11 w-full gap-2 rounded-lg bg-brand-dark text-sm font-semibold text-on-brand hover:bg-brand-dark/90 disabled:opacity-40"
                  >
                    {isCreatingBooking ? t("processing") : isBookingFirst ? t("requestBooking") : t("payAndBook")} <ArrowRight size={15} />
                  </Button>

                  <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Lock size={11} /> {t("sslSecure")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Info size={11} /> {t("noHiddenFees")}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </>
      ) : (
        /* CONFIRMATION */
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-dark/10">
              <CheckCircle size={32} className="text-brand-dark" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{isBookingFirst ? t("requestSent") : t("bookingCreated")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isBookingFirst ? t("awaitingExpertConfirmation") : t("redirectingToPayment")}
            </p>

            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-border bg-muted p-4 text-left">
              <BookingSummaryCard
                data={{
                  expertName: profile.displayName,
                  serviceName: activeService?.name ?? "—",
                  date: selectedDate ? new Date(year, month, selectedDate) : undefined,
                  slotStart: selectedSlot?.start,
                  currency: activeService?.currency,
                  flatFee: serviceFee,
                }}
                compact
              />
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline" className="rounded-xl border-border text-xs">
                <Link href="/client/dashboard">{t("goToDashboard")}</Link>
              </Button>
              <Button asChild className="rounded-xl bg-brand-dark text-xs text-on-brand hover:bg-brand-dark/90">
                <Link href="/search">{t("findAnotherLawyer")}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<BookingSkeleton />}>
      <BookingContent {...props} />
    </Suspense>
  );
}
