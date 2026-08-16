"use client";

import { use, useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { ArrowLeft, Video, Mic, MicOff, VideoOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { ConsultationRoom } from "@/features/booking/components/consultation-room";
import { useTranslations } from "next-intl";

export default function JoinConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { booking, isLoading, error } = useBooking(id);
  const t = useTranslations("clientDashboard.join");
  
  const [deviceCheck, setDeviceCheck] = useState<"checking" | "success" | "error">("checking");
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [joined, setJoined] = useState(false);

  // Check device permissions
  useEffect(() => {
    async function checkDevices() {
      try {
        // Request camera and microphone permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Check available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === "videoinput");
        const mics = devices.filter(d => d.kind === "audioinput");

        setHasCamera(cameras.length > 0);
        setHasMic(mics.length > 0);
        setDeviceCheck("success");

        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Device check failed:", err);
        setDeviceCheck("error");
      }
    }

    checkDevices();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark/50 dark:text-white/50" />
      </div>
    );
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
  const canJoin = ["CONFIRMED", "ACTIVE"].includes(booking.status);
  
  if (!canJoin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-black px-6">
        <AlertCircle className="h-10 w-10 text-amber-500 mb-4" />
        <p className="text-amber-600 dark:text-amber-400 font-medium">{t("cannotJoin")}</p>
        <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50 mb-6 text-center max-w-md">
          {t("notReadyStatus", { status: booking.status })}
        </p>
        <Button asChild variant="outline" className="border-brand-border/20 text-xs">
          <Link href={`/client/dashboard/consultations/${id}`}>{t("viewBookingDetails")}</Link>
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
                  {new Date(booking.scheduledStart).toLocaleString()}
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
              <div className="flex items-center gap-3 text-[13px] text-brand-dark/60 dark:text-white/60">
                <Loader2 size={16} className="animate-spin" />
                <span>{t("checkingDevices")}</span>
              </div>
            ) : deviceCheck === "error" ? (
              <div className="space-y-4">
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
                <div className="flex items-center justify-between rounded-lg border border-brand-border/20 p-3 dark:border-white/20">
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

          {/* Info */}
          <div className="mt-4 rounded-xl bg-brand-dark/5 p-4 text-center dark:bg-white/5">
            <p className="text-[11px] text-brand-dark/60 dark:text-white/60">
              {t("recordingNotice")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
