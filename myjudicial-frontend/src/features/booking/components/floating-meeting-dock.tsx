"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  PhoneOff,
  PictureInPicture2,
  Clock,
  Loader2,
  Shield,
} from "lucide-react";
import { useActiveConsultation } from "../context/active-consultation-context";
import { usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/auth-provider";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function FloatingMeetingDock() {
  const t = useTranslations("expertDashboard_consultation-room");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const {
    activeBookingId,
    status,
    remoteParticipants,
    callDurationSeconds,
    isAudioEnabled,
    isVideoEnabled,
    isRecording,
    toggleAudio,
    toggleVideo,
    leaveCall,
    isMinimized,
    setIsMinimized,
    setVideoRef,
  } = useActiveConsultation();

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const miniVideoRef = useRef<HTMLVideoElement | null>(null);

  // Check if we are currently on the full join page
  const isOnJoinPage =
    pathname?.includes("/consultations/") && pathname?.endsWith("/join");

  // Show dock when an active call is connected/connecting AND either isMinimized is true OR user navigated to another route
  const shouldShow =
    Boolean(activeBookingId) &&
    (status === "connected" || status === "connecting" || status === "reconnecting") &&
    (!isOnJoinPage || isMinimized);

  const remoteParticipant = remoteParticipants[0];

  useEffect(() => {
    if (!shouldShow || !remoteParticipant || !miniVideoRef.current) return;
    setVideoRef(remoteParticipant.sid, miniVideoRef.current);
  }, [remoteParticipant, setVideoRef, shouldShow]);

  // Picture-in-Picture trigger
  const handleTogglePiP = async () => {
    if (!miniVideoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await miniVideoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("Picture-in-Picture error:", err);
    }
  };

  const handleReturnToCall = () => {
    setIsMinimized(false);
    if (!activeBookingId) return;
    const isExpert = user?.role === "EXPERT" || (pathname ? pathname.includes("/expert") : false);
    const targetUrl = isExpert
      ? `/expert/dashboard/consultations/${activeBookingId}/join`
      : `/client/dashboard/consultations/${activeBookingId}/join`;
    router.push(targetUrl);
  };

  if (!shouldShow) return null;

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSec % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <>
      {/* Leave Confirmation Dialog in Dock */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xs rounded-2xl bg-gray-900 border border-white/10 p-5 shadow-2xl text-white">
            <p className="text-sm font-semibold mb-1.5">{t("leaveConfirmTitle")}</p>
            <p className="text-white/60 text-xs mb-4 leading-relaxed">
              {t("leaveConfirmDesc")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-white/20 text-white hover:bg-white/10 text-xs"
                onClick={() => setShowLeaveConfirm(false)}
              >
                {t("leaveConfirmCancel")}
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  leaveCall();
                }}
              >
                {t("leaveConfirmLeave")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Mini Dock */}
      <div
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-72 sm:w-80 overflow-hidden rounded-2xl border border-white/15 bg-gray-950/95 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-200"
        role="region"
        aria-label="Active Consultation Floating Window"
      >
        {/* Top Header / Video Area */}
        <div className="relative aspect-video w-full bg-gray-900 overflow-hidden group">
          {remoteParticipant ? (
            <video
              ref={miniVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-white/50 p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              <p className="text-xs">{t("waitingForParticipant", { defaultValue: "Consultation in progress..." })}</p>
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm border border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {formatDuration(callDurationSeconds)}
            </span>
            {isRecording && (
              <span className="flex items-center gap-1 rounded-full bg-red-950/80 px-2 py-0.5 text-[10px] font-medium text-red-200 border border-red-500/30">
                REC
              </span>
            )}
          </div>

          {/* Hover overlay with Expand and PiP */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button
              size="sm"
              onClick={handleReturnToCall}
              className="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5 shadow-lg"
              title={t("maximizeCall", { defaultValue: "Return to meeting" })}
            >
              <Maximize2 size={14} />
              <span>{t("returnToMeeting", { defaultValue: "Return" })}</span>
            </Button>
            {typeof document !== "undefined" && document.pictureInPictureEnabled && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleTogglePiP}
                className="h-9 w-9 p-0 rounded-xl border-white/20 text-white bg-black/60 hover:bg-black/90 shadow-lg"
                title={t("pipLabel", { defaultValue: "Picture in Picture" })}
              >
                <PictureInPicture2 size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between border-t border-white/10 bg-gray-900/90 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            {/* Mic Toggle */}
            <Button
              size="sm"
              onClick={toggleAudio}
              className={`h-8 w-8 rounded-full p-0 transition-colors ${
                isAudioEnabled
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
              title={isAudioEnabled ? t("muteLabel") : t("unmuteLabel")}
            >
              {isAudioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
            </Button>

            {/* Video Toggle */}
            <Button
              size="sm"
              onClick={toggleVideo}
              className={`h-8 w-8 rounded-full p-0 transition-colors ${
                isVideoEnabled
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
              title={isVideoEnabled ? t("videoOffLabel") : t("videoOnLabel")}
            >
              {isVideoEnabled ? <Video size={14} /> : <VideoOff size={14} />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Return Link */}
            <button
              onClick={handleReturnToCall}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t("expandCall", { defaultValue: "Expand" })}
            </button>

            {/* Leave Call */}
            <Button
              size="sm"
              onClick={() => setShowLeaveConfirm(true)}
              className="h-8 w-8 rounded-full bg-red-600 hover:bg-red-500 text-white p-0"
              title={t("leaveLabel")}
            >
              <PhoneOff size={14} />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
