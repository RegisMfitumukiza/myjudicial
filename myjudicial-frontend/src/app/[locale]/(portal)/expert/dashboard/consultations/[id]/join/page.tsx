"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { ArrowLeft, Video, Mic, VideoOff, Loader2, AlertCircle, CheckCircle, Brain, Sparkles } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { DetailPageSkeleton } from "@/shared/components/dashboard/loading";
import { Button } from "@/shared/components/ui/button";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { ConsultationRoom } from "@/features/booking/components/consultation-room";
import { useActiveConsultation } from "@/features/booking/context/active-consultation-context";
import { JOINABLE_EARLY_WINDOW_MS, OVERTIME_GRACE_WINDOW_MS } from "@/features/booking/constants";
import { useCaseAnalysis } from "@/features/ai/hooks/use-case-analysis";
import { AiAnalysisCard } from "@/features/ai/components/ai-analysis-card";
import type { CaseAnalysis } from "@/features/ai/types";

const BACK_HREF = "/expert/dashboard/bookings";

export default function ExpertJoinConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { booking, isLoading, error } = useBooking(id);
  const t = useTranslations("expertDashboard_join");
  const locale = useLocale();

  const { activeBookingId, status: activeStatus, setIsMinimized } = useActiveConsultation();
  const isAlreadyActive =
    activeBookingId === id &&
    (activeStatus === "connected" || activeStatus === "connecting");

  const [deviceCheck, setDeviceCheck] = useState<"checking" | "success" | "error" | "skipped">(
    isAlreadyActive ? "success" : "checking"
  );
  const [deviceError, setDeviceError] = useState<"" | "permissionDenied" | "deviceUnavailable" | "error">("");
  const [hasCamera, setHasCamera] = useState(isAlreadyActive);
  const [hasMic, setHasMic] = useState(isAlreadyActive);
  const [joined, setJoined] = useState(isAlreadyActive);

  // When returning to this page for an already active meeting, ensure un-minimized
  useEffect(() => {
    if (isAlreadyActive) {
      setIsMinimized(false);
      setJoined(true);
    }
  }, [isAlreadyActive, setIsMinimized]);

  const previewStreamRef = useRef<MediaStream | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const analyzeMutation = useCaseAnalysis();
  const [aiAnalysis, setAiAnalysis] = useState<CaseAnalysis | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAnalyzeNotes = useCallback(async () => {
    const notes = booking?.citizenNotes;
    if (!notes || analyzeMutation.isPending) return;
    setAiError(null);
    try {
      const result = await analyzeMutation.mutateAsync({ text: notes });
      setAiAnalysis(result.analysis);
    } catch {
      setAiError(t("analyzeError"));
    }
  }, [booking, analyzeMutation, t]);

  const hasNotes = !!booking?.citizenNotes;

  // F-09: Gate device check on booking load and VIDEO delivery mode only
  useEffect(() => {
    if (!booking || isAlreadyActive || joined) return;
    const deliveryMode = (booking as any).service?.deliveryMode ?? "VIDEO";
    if (deliveryMode !== "VIDEO") {
      setDeviceCheck("skipped");
      return;
    }

    async function checkDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // Keep stream for camera preview
        previewStreamRef.current = stream;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((d) => d.kind === "videoinput");
        const mics = devices.filter((d) => d.kind === "audioinput");
        setHasCamera(cameras.length > 0);
        setHasMic(mics.length > 0);
        setDeviceCheck("success");
      } catch (err: any) {
        console.error("Device check failed:", err);
        const name: string = err?.name ?? "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setDeviceError("permissionDenied");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setDeviceError("deviceUnavailable");
        } else {
          setDeviceError("error");
        }
        setDeviceCheck("error");
      }
    }

    checkDevices();

    return () => {
      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
    };
  }, [booking, isAlreadyActive, joined]);

  // Stop preview when joining room (room opens its own stream)
  useEffect(() => {
    if (joined) {
      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
    }
  }, [joined]);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !booking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-black px-6">
        <AlertCircle className="h-10 w-10 text-brand-alert mb-4" />
        <p className="text-brand-alert font-medium">{t("failedToLoad")}</p>
        <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50 mb-6">
          {error instanceof Error ? error.message : t("bookingNotFound")}
        </p>
        <Button asChild variant="outline" className="border-brand-border/20 text-xs">
          <Link href={BACK_HREF}>{t("backToBookings", { defaultValue: "Back to Bookings" })}</Link>
        </Button>
      </div>
    );
  }

  const nowMs = Date.now();
  const startMs = new Date(booking.scheduledStart).getTime();
  const endMs = new Date(booking.scheduledEnd).getTime();
  const isTooEarly = nowMs < startMs - JOINABLE_EARLY_WINDOW_MS;
  const isPastWindow = nowMs > endMs + OVERTIME_GRACE_WINDOW_MS;
  const isEnded = Boolean((booking as any).actualEndTime || (booking as any).completedAt);
  const isEligibleStatus = ["CONFIRMED", "ACTIVE"].includes(booking.status);
  const canJoin = isEligibleStatus && !isTooEarly && !isPastWindow && !isEnded;

  if (!canJoin) {
    let reasonText = t("notReady", { status: booking.status });
    if (isEnded || isPastWindow) {
      reasonText = t("windowEndedDesc");
    } else if (isTooEarly) {
      reasonText = t("tooEarlyDesc");
    }

    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-black px-6">
        <AlertCircle className="h-10 w-10 text-amber-500 mb-4" />
        <p className="text-amber-600 dark:text-amber-400 font-medium">{t("cannotJoin")}</p>
        <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50 mb-6 text-center max-w-md">
          {reasonText}
        </p>
        <Button asChild variant="outline" className="border-brand-border/20 text-xs">
          <Link href={BACK_HREF}>{t("backToBookings", { defaultValue: "Back to Bookings" })}</Link>
        </Button>
      </div>
    );
  }

  if (joined) {
    return <ConsultationRoom bookingId={id} onLeave={() => router.push(BACK_HREF)} isExpert={true} />;
  }

  const clientName = booking.citizen
    ? `${booking.citizen.firstName} ${booking.citizen.lastName}`.trim()
    : t("client");

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-black">
      <div className="border-b border-brand-border/20 dark:border-white/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4">
          <Link
            href={BACK_HREF}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
          >
            <ArrowLeft size={14} />
            {t("backToMeetings")}
          </Link>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-2.5 min-[360px]:p-4 sm:p-6 min-w-0">
        <div className="w-full max-w-2xl">
          <div className="mb-6 rounded-2xl border border-brand-border/20 bg-white p-4 sm:p-6 shadow-md dark:border-white/20 dark:bg-black">
            <h1 className="text-[22px] font-bold text-brand-dark dark:text-white mb-4">
              {t("readyToJoin")}
            </h1>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-brand-dark/60 dark:text-white/60">{t("client")}</span>
                <span className="font-semibold text-brand-dark dark:text-white">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-dark/60 dark:text-white/60">{t("service")}</span>
                <span className="font-semibold text-brand-dark dark:text-white">
                  {booking.service?.name ?? t("consultationFallback")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-dark/60 dark:text-white/60">{t("scheduled")}</span>
                <span className="font-semibold text-brand-dark dark:text-white">
                  {new Date(booking.scheduledStart).toLocaleString(locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Pre-Consultation AI Briefing */}
          {hasNotes && !joined && (
            <div className="mb-6 rounded-2xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-white/20 dark:bg-black">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark/10">
                    <Brain size={14} className="text-brand-dark" />
                  </div>
                  <h2 className="text-[14px] font-bold text-brand-dark dark:text-white">{t("preConsultationBrief")}</h2>
                </div>
                {!aiAnalysis && !analyzeMutation.isPending && (
                  <button
                    onClick={handleAnalyzeNotes}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-dark/10 px-3 py-1.5 text-[12px] font-semibold text-brand-dark transition-colors hover:bg-brand-dark/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                  >
                    <Sparkles size={12} />
                    {t("analyze")}
                  </button>
                )}
              </div>

              {booking.citizenNotes && !aiAnalysis && !analyzeMutation.isPending && (
                <div className="rounded-lg bg-brand-dark/5 px-3 py-2 dark:bg-white/5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-dark/40 dark:text-white/40 mb-1">{t("clientNotes")}</p>
                  <p className="text-[12px] text-brand-dark/70 dark:text-white/70 leading-relaxed">{booking.citizenNotes}</p>
                </div>
              )}

              {analyzeMutation.isPending && (
                <div className="flex items-center gap-2 py-4 text-[13px] text-brand-dark/50 dark:text-white/50">
                  <Loader2 size={14} className="animate-spin" />
                  {t("analyzingCase")}
                </div>
              )}

              {aiAnalysis && (
                <AiAnalysisCard analysis={aiAnalysis} />
              )}

              {aiError && (
                <p className="text-[12px] text-red-600 dark:text-red-400 mt-2">{aiError}</p>
              )}
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[16px] font-bold text-brand-dark dark:text-white mb-4">{t("deviceCheck")}</h2>

            {deviceCheck === "checking" ? (
              <div className="flex items-center gap-3 text-[13px] text-brand-dark/60 dark:text-white/60">
                <Loader2 size={16} className="animate-spin" />
                <span>{t("checkingDevices")}</span>
              </div>
            ) : deviceCheck === "error" ? (
              <div className="space-y-4">
                {deviceError === "permissionDenied" ? (
                  <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/10 p-4 border border-red-200 dark:border-red-900/30">
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-red-800 dark:text-red-300 mb-1">
                        {t("deviceAccessDenied")}
                      </p>
                      <p className="text-[12px] text-red-700 dark:text-red-400">
                        {t("deviceAccessDeniedDesc")}
                      </p>
                    </div>
                  </div>
                ) : deviceError === "deviceUnavailable" ? (
                  <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 p-4 border border-amber-200 dark:border-amber-900/30">
                    <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        {t("deviceUnavailable")}
                      </p>
                      <p className="text-[12px] text-amber-700 dark:text-amber-400">
                        {t("deviceUnavailableDesc")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/10 p-4 border border-red-200 dark:border-red-900/30">
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-red-800 dark:text-red-300 mb-1">
                        {t("deviceError")}
                      </p>
                      <p className="text-[12px] text-red-700 dark:text-red-400">
                        {t("deviceErrorDesc")}
                      </p>
                    </div>
                  </div>
                )}
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full border-brand-border/20 text-[13px]"
                >
                  {t("refreshPage")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Camera row with live preview */}
                <div className="rounded-lg border border-brand-border/20 p-3 dark:border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Video size={16} className="text-brand-dark/60 dark:text-white/60" />
                      <span className="text-[13px] text-brand-dark dark:text-white">{t("camera")}</span>
                    </div>
                    {hasCamera ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle size={14} />
                        <span className="text-[12px] font-semibold">{t("ready")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <VideoOff size={14} />
                        <span className="text-[12px] font-semibold">{t("notFound")}</span>
                      </div>
                    )}
                  </div>
                  {hasCamera && (
                    <video
                      ref={previewVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-lg aspect-video object-cover bg-black mb-1"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border border-brand-border/20 p-3 dark:border-white/20">
                  <div className="flex items-center gap-2">
                    <Mic size={16} className="text-brand-dark/60 dark:text-white/60" />
                    <span className="text-[13px] text-brand-dark dark:text-white">{t("microphone")}</span>
                  </div>
                  {hasMic ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle size={14} />
                      <span className="text-[12px] font-semibold">{t("ready")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertCircle size={14} />
                      <span className="text-[12px] font-semibold">{t("notFound")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={() => setJoined(true)}
            disabled={(deviceCheck !== "success" && deviceCheck !== "skipped") || (!hasCamera && !hasMic && deviceCheck !== "skipped")}
            className="w-full rounded-xl bg-brand-dark py-6 text-[16px] font-semibold text-white hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-black"
          >
            <Video className="mr-2" size={18} />
            {t("joinConsultation")}
          </Button>

          {/* Privacy Notice — replaces the false recording claim */}
          <div className="mt-4 rounded-xl bg-brand-dark/5 p-4 text-center dark:bg-white/5">
            <p className="text-[11px] text-brand-dark/60 dark:text-white/60">
              {t("privacyNotice")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
