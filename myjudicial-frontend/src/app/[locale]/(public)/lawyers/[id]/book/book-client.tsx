"use client";

import { useState, useEffect, use, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  ArrowRight, CheckCircle, MessageSquare,
  ShieldCheck, Lock, Info, Coins, Smartphone,
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
import { PaymentForm, formatPhoneForInput } from "@/features/booking/components/payment-form";
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
    <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 py-6 sm:py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 min-[360px]:p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                {i === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="h-20 animate-pulse rounded-xl bg-muted" />
                    <div className="h-20 animate-pulse rounded-xl bg-muted" />
                  </div>
                )}
                {i === 3 && (
                  <div className="grid grid-cols-7 gap-1 min-[340px]:gap-1.5">
                    {Array.from({ length: 14 }).map((_, j) => (
                      <div key={j} className="h-8 min-[340px]:h-9 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 min-[360px]:p-6 shadow-sm">
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
function BookingError({ t }: { t: ReturnType<typeof useTranslations> }) {
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
  const { isBookingFirst, airtelEnabled, isLoading: paymentModeLoading } = usePaymentMode();

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

  const { data: session } = useSession();
  const registeredUserPhone = session?.user?.phone ?? null;

  /* ── Prefill payment phone with registered profile phone if empty ── */
  useEffect(() => {
    if (registeredUserPhone && !paymentPhone) {
      setPaymentPhone(formatPhoneForInput(registeredUserPhone));
    }
  }, [registeredUserPhone, paymentPhone]);
  const [timezone, setTimezone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mj_timezone") || "Africa/Kigali";
    }
    return "Africa/Kigali";
  });

  /* ── Restore draft booking state if returning after sign-in ── */
  useEffect(() => {
    if (typeof window === "undefined" || !id) return;
    try {
      const saved = sessionStorage.getItem(`mj_pending_booking_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedService) setSelectedService(parsed.selectedService);
        if (typeof parsed.month === "number") setMonth(parsed.month);
        if (typeof parsed.year === "number") setYear(parsed.year);
        if (typeof parsed.selectedDate === "number") setSelectedDate(parsed.selectedDate);
        if (parsed.selectedTime) setSelectedTime(parsed.selectedTime);
        if (parsed.selectedSlot) setSelectedSlot(parsed.selectedSlot);
        if (parsed.reason) setReason(parsed.reason);
        sessionStorage.removeItem(`mj_pending_booking_${id}`);
      } else {
        // If no pending booking draft, check if the client recently completed onboarding intake
        const intakeRaw = sessionStorage.getItem("mj_client_intake");
        if (intakeRaw) {
          const intake = JSON.parse(intakeRaw);
          if (intake.situation && !reason) {
            const urgencyPrefix = (intake.urgency === "urgent" || intake.urgency === "emergency")
              ? `[${intake.urgency.toUpperCase()}] `
              : "";
            setReason(`${urgencyPrefix}${intake.situation}`);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [id, reason]);

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

    // Gated upon submission: if user is not authenticated or not a citizen, trigger sign-in
    if (!requireAuth(pathname + (activeService.id ? `?serviceId=${activeService.id}` : ""))) {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(
            `mj_pending_booking_${id}`,
            JSON.stringify({
              selectedService: activeService.id,
              selectedDate,
              selectedTime,
              selectedSlot,
              reason,
              month,
              year,
            })
          );
        } catch {
          // ignore
        }
      }
      return;
    }

    const isPaymentRequired = !isBookingFirst;
    const rawInputPhone = paymentPhone.trim() || formatPhoneForInput(registeredUserPhone);
    const digitsOnly = rawInputPhone.replace(/\D/g, "");
    let cleanPhone = "";
    if (digitsOnly.length === 9) {
      cleanPhone = `0${digitsOnly}`;
    } else if (digitsOnly.length === 10 && digitsOnly.startsWith("0")) {
      cleanPhone = digitsOnly;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith("250")) {
      cleanPhone = `+${digitsOnly}`;
    } else {
      cleanPhone = digitsOnly;
    }

    if (isPaymentRequired && (!cleanPhone || cleanPhone.length < 10)) {
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
        ? { paymentMNO, paymentPhoneNumber: cleanPhone }
        : {}),
    }, {
      onSuccess: (data) => {
        setCreatedBookingId(data.booking.id);
        setConfirmed(true);
        if (!isBookingFirst && data.payment?.paymentLink) {
          window.location.href = data.payment.paymentLink;
        }
      },
      onError: (err: any) => {
        const errorMsg =
          err?.message ||
          (err as any)?.response?.data?.message ||
          t("bookingFailed");
        toast.error(errorMsg);
      },
    });
  }

  /* ── Loading: show skeleton while initial profile or session resolves ── */
  if (authStatus === "loading" || profileLoading || servicesResult.isLoading || paymentModeLoading) {
    return <BookingSkeleton />;
  }

  /* ── Error: friendly unavailability state ── */
  if (profileError || !expertProfile) {
    return <BookingError t={t} />;
  }

  const profile = (expertProfile as unknown as { data: { data: { id: string; displayName: string; bio?: string; primarySpecialty?: string; avgRating?: number; totalBookings?: number; baseConsultationFee?: number; profileImageUrl?: string; officeAddress?: string; yearsExperience?: number; city?: string; languages?: string[]; verified?: boolean } } }).data.data;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  return (
    <div className="min-h-screen bg-background">
      {!confirmed ? (
        <>
          <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 py-6 sm:py-8 sm:px-6">
            {/* Back to Expert Profile Breadcrumb */}
            <div className="mb-4">
              <Link
                href={`/lawyers/${id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft size={14} />
                <span>{t("backToProfile")}: {profile.displayName}</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

              {/* LEFT */}
              <div className="space-y-6">

                {/* 1. EXPERT INFORMATION */}
                <section className="rounded-2xl border border-border bg-card p-4 min-[360px]:p-6 shadow-sm">
                  <div className="mb-4 sm:mb-5 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-on-brand shrink-0">1</span>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground truncate">{t("expertInformation")}</h2>
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
                  <section className="rounded-2xl border border-border bg-card p-4 min-[360px]:p-6 shadow-sm">
                    <div className="mb-4 sm:mb-5 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-on-brand shrink-0">2</span>
                      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground truncate">{t("selectServiceType")}</h2>
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
                <section className="rounded-2xl border border-border bg-card p-4 min-[360px]:p-6 shadow-sm">
                  <div className="mb-4 sm:mb-5 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-on-brand shrink-0">
                      {activeService ? "3" : services.length > 0 ? "3" : "2"}
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground truncate">{t("date")} & {t("time")}</h2>
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

                  <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-[1fr_220px]">
                    {/* Calendar */}
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2 flex-wrap min-[340px]:flex-nowrap">
                        <p className="flex items-center gap-1.5 text-xs min-[360px]:text-sm font-bold text-foreground min-w-0 truncate">
                          <CalendarIcon className="h-4 w-4 text-foreground shrink-0" />
                          <span className="truncate">{t("selectConsultDate")} — {t(`months.${MONTH_KEYS[month]}`)} {year}</span>
                        </p>
                        <div className="flex gap-1 shrink-0">
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
                          <div key={k} className="py-1 text-[9px] min-[340px]:text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            {t(`days.${k}`)}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 min-[340px]:gap-1.5">
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
                              className={`flex h-8 min-[340px]:h-9 w-full items-center justify-center rounded-lg text-xs min-[340px]:text-[13px] font-medium transition-colors ${
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
                      <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                        <p className="flex items-center gap-1.5 text-xs min-[360px]:text-sm font-bold text-foreground">
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
                    <label className="mb-2 flex items-center gap-1.5 text-xs min-[360px]:text-sm font-semibold text-foreground">
                      <MessageSquare className="h-4 w-4 text-foreground shrink-0" />
                      {t("reason")} ({t("optional")})
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t("describeIssue")}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs min-[360px]:text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-dark"
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
                      className="rounded-xl border border-border bg-card p-3.5 min-[360px]:p-4 text-center shadow-sm"
                    >
                      <Icon className="mx-auto mb-2 h-5 w-5 text-foreground" />
                      <p className="text-xs min-[360px]:text-sm font-bold text-foreground">{title}</p>
                      <p className="mt-0.5 text-[11px] min-[360px]:text-xs text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Booking Summary */}
              <aside className="h-fit lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)]">
                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col lg:max-h-[calc(100vh-5.5rem)]">
                  {/* Scrollable upper content */}
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none pr-0.5 space-y-4">
                    <BookingSummaryCard
                      data={{
                        expertName: profile.displayName,
                        serviceName: activeService?.name ?? t("notSelected"),
                        date: selectedDate ? new Date(year, month, selectedDate) : undefined,
                        slotStart: selectedSlot?.start,
                        slotEnd: selectedSlot?.end,
                        durationMin: activeService?.durationMin,
                        currency: activeService?.currency,
                        flatFee: serviceFee,
                        deliveryMode: activeService?.deliveryMode ?? undefined,
                        timezone,
                      }}
                      showDeliveryMode
                      compact
                    />

                    {!isBookingFirst && (
                      <div className="border-t border-border/60 pt-3.5">
                        <PaymentForm
                          paymentMNO={paymentMNO}
                          paymentPhone={paymentPhone}
                          onMNOChange={setPaymentMNO}
                          onPhoneChange={setPaymentPhone}
                          registeredPhone={registeredUserPhone}
                          showLabel={false}
                          compact
                          airtelEnabled={airtelEnabled}
                        />
                      </div>
                    )}
                  </div>

                  {/* Pinned Action Footer */}
                  <div className="shrink-0 pt-3 border-t border-border/60 bg-card mt-3 space-y-2.5">
                    {!isBookingFirst && (
                      <div className="flex items-start gap-2 rounded-lg bg-muted/60 border border-border/40 p-2.5 text-[11px] text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                        <p className="leading-relaxed">
                          <span className="font-semibold text-foreground">{t("securedByEscrow")}</span>{" "}
                          <span>{t("paymentHeldSafely")}</span>
                        </p>
                      </div>
                    )}

                    <Button
                      disabled={!canSubmit || isCreatingBooking}
                      onClick={handleRequest}
                      className="h-11 w-full gap-2 rounded-lg bg-brand-dark text-sm font-semibold text-on-brand hover:bg-brand-dark/90 disabled:opacity-40"
                    >
                      {isCreatingBooking ? (
                        t("processing")
                      ) : !canSubmit ? (
                        t("selectDateTimePrompt")
                      ) : authStatus === "unauthenticated" ? (
                        `${t("signInToBook")} • ${isBookingFirst ? t("requestBooking") : t("payAndBook")}`
                      ) : isBookingFirst ? (
                        t("requestBooking")
                      ) : (
                        `${t("payAndBook")} • ${activeService?.currency ?? "RWF"} ${Number(serviceFee).toLocaleString()}`
                      )}{" "}
                      <ArrowRight size={15} />
                    </Button>

                    {authStatus === "unauthenticated" && (
                      <p className="text-center text-[11px] text-muted-foreground leading-normal">
                        {t("guestBookingPrompt")}
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Lock size={11} /> {t("sslSecure")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Info size={11} /> {t("noHiddenFees")}
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </>
      ) : (
        /* CONFIRMATION */
        <div className="mx-auto max-w-lg px-3 min-[360px]:px-4 py-10 sm:py-16 sm:px-6">
          <div className="rounded-2xl border border-border bg-card p-5 min-[360px]:p-8 sm:p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 sm:mb-5 flex h-14 w-14 min-[360px]:h-16 min-[360px]:w-16 items-center justify-center rounded-full bg-brand-dark/10">
              <CheckCircle size={28} className="min-[360px]:hidden text-brand-dark" />
              <CheckCircle size={32} className="hidden min-[360px]:block text-brand-dark" />
            </div>
            <h2 className="text-lg min-[360px]:text-xl font-bold text-foreground">{isBookingFirst ? t("requestSent") : t("bookingCreated")}</h2>
            <p className="mt-1.5 sm:mt-2 text-xs min-[360px]:text-sm text-muted-foreground">
              {isBookingFirst ? t("awaitingExpertConfirmation") : t("redirectingToPayment")}
            </p>

            <div className="mx-auto mt-5 sm:mt-6 max-w-sm rounded-xl border border-border bg-muted p-3.5 min-[360px]:p-4 text-left">
              <BookingSummaryCard
                data={{
                  expertName: profile.displayName,
                  serviceName: activeService?.name ?? "—",
                  date: selectedDate ? new Date(year, month, selectedDate) : undefined,
                  slotStart: selectedSlot?.start,
                  slotEnd: selectedSlot?.end,
                  currency: activeService?.currency,
                  flatFee: serviceFee,
                  timezone,
                }}
                compact
              />
            </div>

            <div className="mt-6 flex flex-col min-[360px]:flex-row justify-center gap-2.5 sm:gap-3">
              <Button asChild variant="outline" className="w-full min-[360px]:w-auto rounded-xl border-border text-xs">
                <Link href="/client/dashboard">{t("goToDashboard")}</Link>
              </Button>
              <Button asChild className="w-full min-[360px]:w-auto rounded-xl bg-brand-dark text-xs text-on-brand hover:bg-brand-dark/90">
                <Link href="/search">{t("findAnotherLawyer")}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookClient(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<BookingSkeleton />}>
      <BookingContent {...props} />
    </Suspense>
  );
}
