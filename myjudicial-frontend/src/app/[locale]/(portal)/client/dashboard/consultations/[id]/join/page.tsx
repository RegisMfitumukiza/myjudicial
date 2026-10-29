"use client";

import { use, useState, useEffect, useRef } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { ArrowLeft, Video, Mic, MicOff, VideoOff, Loader2, AlertCircle, CheckCircle, MapPin, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { ConsultationRoom } from "@/features/booking/components/consultation-room";
import { useActiveConsultation } from "@/features/booking/context/active-consultation-context";
import { JOINABLE_EARLY_WINDOW_MS, OVERTIME_GRACE_WINDOW_MS } from "@/features/booking/constants";
import { useTranslations, useLocale } from "next-intl";
import { DetailPageSkeleton } from "@/shared/components/dashboard/loading";

export default function JoinConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { booking, isLoading, error } = useBooking(id);
  const t = useTranslations("clientDashboard.join");
  const locale = useLocale();

  const { activeBookingId, status: activeStatus, setIsMinimized } = useActiveConsultation();
  const isAlreadyActive =
    activeBookingId === id &&
    (activeStatus === "connected" || activeStatus === "connecting");

  const [deviceCheck, setDeviceCheck] = useState<"checking" | "success" | "error">(
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

  // Check device permissions (only for video delivery mode)
  useEffect(() => {
    if (!booking || isAlreadyActive || joined) return;
    const deliveryMode = (booking as any).service?.deliveryMode ?? "VIDEO";
    if (deliveryMode !== "VIDEO") return;

    async function checkDevices() {
      try {
        // Request camera and microphone permissions and keep stream for preview
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        // Attach stream to ref for cleanup later
        previewStreamRef.current = stream;

        // Attach to video element if already mounted
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }

        // Check available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === "videoinput");
        const mics = devices.filter(d => d.kind === "audioinput");

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
      // Cleanup preview stream on unmount
      previewStreamRef.current?.getTracks().forEach(track => track.stop());
      previewStreamRef.current = null;
    };
  }, [booking, isAlreadyActive, joined]);

  // Stop preview stream when the room is joined (room opens its own stream)
  useEffect(() => {
    if (joined) {
      previewStreamRef.current?.getTracks().forEach(track => track.stop());
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
        <p className="text-brand-alert font-medium">{t("failedToLoadBooking")}</p>
        <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50 mb-6">
          {error instanceof Error ? error.message : t("bookingNotFound")}
        </p>
        <Button asChild variant="outline" className="border-brand-border/20 text-xs">
          <Link href="/client/dashboard/consultations">{t("backToMyBookings")}</Link>
        </Button>
      </div>
    );
  }

  // Check if booking is ready for consultation
  const nowMs = Date.now();
  const startMs = new Date(booking.scheduledStart).getTime();
  const endMs = new Date(booking.scheduledEnd).getTime();
  const isTooEarly = nowMs < startMs - JOINABLE_EARLY_WINDOW_MS;
  const isPastWindow = nowMs > endMs + OVERTIME_GRACE_WINDOW_MS;
  const isEnded = Boolean((booking as any).actualEndTime || (booking as any).completedAt);
  const isEligibleStatus = ["CONFIRMED", "ACTIVE"].includes(booking.status);
  const canJoin = isEligibleStatus && !isTooEarly && !isPastWindow && !isEnded;

  if (!canJoin) {
    let reasonText = t("notReadyStatus", { status: booking.status });
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
          <Link href={`/client/dashboard/consultations/${id}`}>{t("viewBookingDetails")}</Link>
        </Button>
      </div>
    );
  }

  // Guard against non-video delivery modes (in-person office appointment, phone, document package)
  const deliveryMode = (booking as any).service?.deliveryMode ?? "VIDEO";
  if (deliveryMode !== "VIDEO") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-black px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-dark/5 dark:bg-white/10 mb-4">
          {deliveryMode === "IN_PERSON" ? (
            <MapPin className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          ) : deliveryMode === "PHONE" ? (
            <Phone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          ) : (
            <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          )}
        </div>
        <h2 className="text-[18px] font-bold text-brand-dark dark:text-white mb-2 max-w-md">
          {deliveryMode === "IN_PERSON"
            ? t("inPersonNotice")
            : deliveryMode === "PHONE"
            ? t("phoneNotice")
            : t("documentNotice")}
        </h2>
        {deliveryMode === "IN_PERSON" && (booking as any).expert?.officeAddress && (
          <p className="text-[14px] text-brand-dark/70 dark:text-white/70 mb-6 max-w-md">
            {(booking as any).expert.officeAddress}{(booking as any).expert?.city ? `, ${(booking as any).expert.city}` : ""}
          </p>
        )}
        <Button asChild className="rounded-xl bg-brand-dark px-6 py-2.5 text-xs font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black">
          <Link href={`/client/dashboard/consultations/${id}`}>
            {deliveryMode === "IN_PERSON" ? t("viewOfficeDetails") : t("viewBookingDetails")}
          </Link>
        </Button>
      </div>
    );
  }

  if (joined) {
    return <ConsultationRoom bookingId={id} onLeave={() => router.push(`/client/dashboard/consultations/${id}`)} />;
  }

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-black">
      {/* Header */}
      <div className="border-b border-brand-border/20 dark:border-white/20">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link
            href={`/client/dashboard/consultations/${id}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
          >
            <ArrowLeft size={14} />
            {t("backToBooking")}
          </Link>
        </div>
      </div>

      {/* Pre-Join Screen */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Booking Info */}
          <div className="mb-6 rounded-2xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-white/20 dark:bg-black">
            <h1 className="text-[22px] font-bold text-brand-dark dark:text-white mb-4">
              {t("readyToJoin")}
            </h1>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-brand-dark/60 dark:text-white/60">{t("expert")}</span>
                <span className="font-semibold text-brand-dark dark:text-white">
                  {booking.expert?.displayName ?? t("legalExpert")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-dark/60 dark:text-white/60">{t("service")}</span>
                <span className="font-semibold text-brand-dark dark:text-white">
                  {booking.service?.name ?? t("consultation")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-dark/60 dark:text-white/60">{t("scheduled")}</span>
                <span className="font-semibold text-brand-dark dark:text-white">
                  {new Date(booking.scheduledStart).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
            </div>
          </div>

          {/* Device Check */}
          <div className="mb-6 rounded-2xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[16px] font-bold text-brand-dark dark:text-white mb-4">
              {t("deviceCheck")}
            </h2>

            {deviceCheck === "checking" ? (
              <div
                className="space-y-4 animate-pulse motion-reduce:animate-none"
                role="status"
                aria-busy="true"
                aria-label={t("checkingDevices")}
              >
                <div className="rounded-xl border border-brand-border/20 p-4 space-y-3 dark:border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-muted" />
                      <div className="h-4 w-20 rounded bg-muted" />
                    </div>
                    <div className="h-4 w-16 rounded bg-muted" />
                  </div>
                  <div className="h-32 w-full rounded-lg bg-muted/60" />
                </div>
                <div className="rounded-xl border border-brand-border/20 p-4 space-y-2 dark:border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-muted" />
                      <div className="h-4 w-24 rounded bg-muted" />
                    </div>
                    <div className="h-4 w-16 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ) : deviceCheck === "error" ? (
              <div className="space-y-4">
                {deviceError === "permissionDenied" ? (
                  <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/10 p-4 border border-red-200 dark:border-red-900/30">
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-red-800 dark:text-red-300 mb-1">
                        {t("deviceDenied")}
                      </p>
                      <p className="text-[12px] text-red-700 dark:text-red-400">
                        {t("deviceDeniedDesc")}
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
                        <AlertCircle size={14} />
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

                {/* Microphone row */}
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

          {/* Join Button */}
          <Button
            onClick={() => setJoined(true)}
            disabled={deviceCheck !== "success" || (!hasCamera && !hasMic)}
            className="w-full rounded-xl bg-brand-dark py-6 text-[16px] font-semibold text-white hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-black"
          >
            <Video className="mr-2" size={18} />
            {t("joinConsultation")}
          </Button>

          {/* Privacy Notice (replaces false recording claim) */}
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
