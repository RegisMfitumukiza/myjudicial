"use client";

import { useEffect, useRef, useState } from "react";
import { ConnectionQuality, Track } from "livekit-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
  AlertCircle,
  Monitor,
  MonitorOff,
  Clock,
  Disc,
  Shield,
  Check,
  MessageSquare,
  FileText,
  Info,
  Minimize2,
  PictureInPicture2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useActiveConsultation,
  MAX_REJOIN_ATTEMPTS,
} from "../context/active-consultation-context";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import { InRoomChatPanel } from "./in-room-chat-panel";
import { InRoomDocumentsPanel } from "./in-room-documents-panel";
import { InRoomDetailsPanel } from "./in-room-details-panel";
import { useRouter } from "@/i18n/routing";

// How long to wait (ms) before showing the "other participant hasn't joined" message
const WAITING_TIMEOUT_MS = 3 * 60 * 1000;

interface ConsultationRoomProps {
  bookingId: string;
  onLeave: () => void;
  isExpert?: boolean;
}

export function ConsultationRoom({
  bookingId,
  onLeave,
  isExpert = false,
}: ConsultationRoomProps) {
  const t = useTranslations("expertDashboard_consultation-room");
  const router = useRouter();
  const { user } = useAuth();

  const {
    activeBookingId,
    status,
    error,
    localVideoTrack,
    remoteParticipants,
    connectionQuality,
    rejoinAttempt,
    callDurationSeconds,
    setIsMinimized,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    screenShareError,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    isRecording,
    recordingSeconds,
    isUploadingRecording,
    recordingSaved,
    startRecording,
    stopRecording,
    joinCall,
    leaveCall,
    setVideoRef,
    setAudioRef,
    localVideoRef,
  } = useActiveConsultation();

  // ── Connect or un-minimize on mount ──────────────────────────────────────
  useEffect(() => {
    setIsMinimized(false);
    if (activeBookingId !== bookingId || status === "idle") {
      void joinCall(bookingId);
    }
  }, [bookingId, activeBookingId, status, joinCall, setIsMinimized]);

  // ── In-Room Collaboration Panels ──────────────────────────────────────────
  const [activePanel, setActivePanel] = useState<
    "chat" | "documents" | "details" | null
  >(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const lastKnownMsgCountRef = useRef<number | null>(null);
  const activePanelRef = useRef(activePanel);
  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  // Background unread message watcher while chat panel is closed
  useEffect(() => {
    if (status !== "connected") return;
    let cancelled = false;
    let convId: string | null = null;

    async function pollUnreadMessages() {
      try {
        if (!convId) {
          const convRes = await apiFetch<{ data: { id: string } }>(
            `/chat/conversations/by-booking/${bookingId}`
          );
          convId = convRes?.data?.id ?? null;
        }
        if (!convId || cancelled) return;

        const msgRes = await apiFetch<{
          data: { messages: Array<{ id: string; senderId: string }> };
        }>(`/chat/conversations/${convId}/messages?limit=30`);
        const msgs = msgRes?.data?.messages;
        if (!msgs || cancelled) return;

        const total = msgs.length;
        if (lastKnownMsgCountRef.current === null) {
          lastKnownMsgCountRef.current = total;
          return;
        }

        if (total > lastKnownMsgCountRef.current) {
          const diff = total - lastKnownMsgCountRef.current;
          const newest = msgs.slice(0, diff);
          const fromOther = newest.filter((m) => m.senderId !== user?.id).length;
          if (fromOther > 0 && activePanelRef.current !== "chat") {
            setUnreadChatCount((prev) => prev + fromOther);
          }
          lastKnownMsgCountRef.current = total;
        }
      } catch {
        // Silent background check
      }
    }

    void pollUnreadMessages();
    const timer = setInterval(() => {
      void pollUnreadMessages();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bookingId, status, user?.id]);

  // ── F-11: Leave confirmation dialog ──────────────────────────────────────
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // ── F-07: Waiting-for-participant timeout ─────────────────────────────────
  const [waitingTooLong, setWaitingTooLong] = useState(false);
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "connected" && remoteParticipants.length === 0) {
      waitingTimerRef.current = setTimeout(() => {
        setWaitingTooLong(true);
      }, WAITING_TIMEOUT_MS);
    } else if (waitingTimerRef.current) {
      clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
    return () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
    };
  }, [status, remoteParticipants.length]);

  const showWaitingTimeout =
    status === "connected" && remoteParticipants.length === 0 && waitingTooLong;

  // ── Local video attachment ────────────────────────────────────────────────
  useEffect(() => {
    const el = localVideoRef.current;
    if (!localVideoTrack || !el) return;
    localVideoTrack.attach(el);
    return () => {
      localVideoTrack.detach(el);
    };
  }, [localVideoTrack, localVideoRef]);

  // ── Re-attach remote video tracks on mount or participant update ──────────
  const localRemoteVideoElementsRef = useRef<
    Record<string, HTMLVideoElement | null>
  >({});

  const handleRemoteVideoRef = (
    sid: string,
    el: HTMLVideoElement | null
  ) => {
    localRemoteVideoElementsRef.current[sid] = el;
    setVideoRef(sid, el);
  };

  useEffect(() => {
    remoteParticipants.forEach((p) => {
      const el = localRemoteVideoElementsRef.current[p.sid];
      if (!el) return;
      p.trackPublications.forEach((pub) => {
        if (pub.track && pub.track.kind === Track.Kind.Video) {
          pub.track.attach(el);
        }
      });
    });
  }, [remoteParticipants]);

  // ── Picture-in-Picture trigger ────────────────────────────────────────────
  const handleTogglePiP = async () => {
    const remoteSid = remoteParticipants[0]?.sid;
    const remoteEl = remoteSid
      ? localRemoteVideoElementsRef.current[remoteSid]
      : null;
    const targetVideo = remoteEl || localVideoRef.current;
    if (!targetVideo) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await targetVideo.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("Picture-in-Picture error:", err);
    }
  };

  // ── Minimize meeting (multitask across portal) ────────────────────────────
  const handleMinimize = () => {
    setIsMinimized(true);
    const targetUrl = isExpert
      ? `/expert/dashboard/consultations/${bookingId}`
      : `/client/dashboard/consultations/${bookingId}`;
    router.push(targetUrl);
  };

  // ── Explicit Leave Call ───────────────────────────────────────────────────
  const handleLeave = () => {
    leaveCall();
    onLeave();
  };

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSec % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // ── Connection quality label map ──────────────────────────────────────────
  const qualityInfo: Record<ConnectionQuality, { label: string; dot: string }> =
    {
      [ConnectionQuality.Excellent]: {
        label: t("qualityExcellent"),
        dot: "bg-emerald-400",
      },
      [ConnectionQuality.Good]: {
        label: t("qualityGood"),
        dot: "bg-emerald-300",
      },
      [ConnectionQuality.Poor]: {
        label: t("qualityPoor"),
        dot: "bg-amber-400",
      },
      [ConnectionQuality.Lost]: {
        label: t("qualityLost"),
        dot: "bg-red-400",
      },
      [ConnectionQuality.Unknown]: { label: "", dot: "bg-gray-400" },
    };
  const quality = qualityInfo[connectionQuality];

  const errorMessage =
    error === "connectionLost"
      ? t("connectionLost")
      : error === "failedToJoin"
      ? t("failedToJoin")
      : error === "roomDeleted"
      ? t("roomDeleted")
      : error === "serverShutdown"
      ? t("serverShutdown")
      : error === "participantRemoved"
      ? t("participantRemoved")
      : error === "duplicateIdentity"
      ? t("duplicateIdentity")
      : error
      ? t("connectionError")
      : "";

  // ── Loading state ─────────────────────────────────────────────────────────
  if (status === "idle" || status === "connecting") {
    return (
      <div
        className="relative flex h-[100dvh] w-full flex-col bg-black overflow-hidden select-none"
        role="status"
        aria-busy="true"
        aria-label={t("connectingToConsultation")}
      >
        {/* Top Bar Skeleton */}
        <div className="absolute inset-x-0 top-3 z-20 flex items-center justify-between px-4 sm:px-6">
          <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse motion-reduce:animate-none" />
          <div className="h-7 w-28 rounded-full bg-white/10 animate-pulse motion-reduce:animate-none" />
        </div>

        {/* Center Stage Skeleton */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl border border-white/10 bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-20 w-20 rounded-full bg-white/10 animate-pulse motion-reduce:animate-none mb-4 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/40 motion-reduce:animate-none" />
            </div>
            <p className="text-white/80 text-[14px] font-medium">{t("connectingToConsultation")}</p>
            <p className="text-white/40 text-[12px] mt-1">{t("connectingDesc", { defaultValue: "Establishing secure end-to-end encrypted connection..." })}</p>
          </div>
        </div>

        {/* Bottom Dock Skeleton */}
        <div className="h-20 border-t border-white/10 bg-black/80 px-4 flex items-center justify-center gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-11 w-11 rounded-full bg-white/10 animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-black px-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-white text-[18px] font-semibold mb-2">
          {t("connectionError")}
        </p>
        <p className="text-white/60 text-[13px] mb-6 text-center max-w-md">
          {errorMessage}
        </p>
        <Button
          onClick={handleLeave}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          {t("backToBooking")}
        </Button>
      </div>
    );
  }

  // ── Main room UI ──────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-black overflow-hidden select-none">
      {/* ── F-11: Leave Confirmation Dialog ───────────────────────────────── */}
      {showLeaveConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-white/10 p-5 sm:p-6 shadow-2xl">
            <p className="text-white text-[16px] font-semibold mb-2">
              {t("leaveConfirmTitle")}
            </p>
            <p className="text-white/60 text-[13px] mb-6 leading-relaxed">
              {t("leaveConfirmDesc")}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10 text-[13px]"
                onClick={() => setShowLeaveConfirm(false)}
              >
                {t("leaveConfirmCancel")}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[13px]"
                onClick={handleLeave}
              >
                {t("leaveConfirmLeave")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reconnecting banner ────────────────────────────────────────────── */}
      {status === "reconnecting" && (
        <div className="absolute inset-x-0 top-14 z-30 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full bg-brand-dark px-4 py-2 text-white shadow-lg ring-1 ring-white/20">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <p className="text-[12px] sm:text-[13px]">
              {rejoinAttempt > 0
                ? t("reconnectingAttempt", {
                    count: rejoinAttempt,
                    max: MAX_REJOIN_ATTEMPTS,
                  })
                : t("reconnecting")}
            </p>
          </div>
        </div>
      )}

      {/* ── Top Bar Status, Call Timer & Recording Indicators ─────────────── */}
      <div className="absolute inset-x-0 top-2.5 sm:top-4 z-20 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Live Call Duration Pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-white backdrop-blur-md ring-1 ring-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] sm:text-[12px] font-semibold tracking-wider text-white/90">
              {formatDuration(callDurationSeconds)}
            </span>
          </div>

          {isRecording && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-950/90 border border-red-500/40 px-2.5 py-1 text-white backdrop-blur-sm shadow-md animate-pulse">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[11px] sm:text-[12px] font-medium tracking-wide text-red-100">
                REC {formatDuration(recordingSeconds)}
              </span>
            </div>
          )}
          {isUploadingRecording && (
            <div className="flex items-center gap-1.5 rounded-full bg-blue-950/90 border border-blue-500/30 px-2.5 py-1 text-white backdrop-blur-sm">
              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
              <span className="text-[11px] sm:text-[12px] text-blue-200">
                {t("uploadingEvidence")}
              </span>
            </div>
          )}
          {recordingSaved && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/30 px-2.5 py-1 text-white backdrop-blur-sm">
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-[11px] sm:text-[12px] text-emerald-200">
                {t("recordingEvidenceSaved")}
              </span>
            </div>
          )}
        </div>

        {/* F-12: Connection quality indicator */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {status === "connected" &&
            connectionQuality !== ConnectionQuality.Unknown && (
              <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-white backdrop-blur-sm ring-1 ring-white/10">
                <span className={`h-2 w-2 rounded-full ${quality.dot}`} />
                <p className="text-[11px] sm:text-[12px] hidden xs:inline">
                  {quality.label}
                </p>
              </div>
            )}
        </div>
      </div>

      {/* ── Evidence Banner ────────────────────────────────────────────────── */}
      {isRecording && (
        <div className="absolute inset-x-0 top-12 sm:top-14 z-20 flex justify-center px-3 pointer-events-none">
          <div className="flex items-center gap-1.5 rounded-full bg-black/85 px-3 py-1 text-white/90 text-[11px] sm:text-[12px] shadow-lg ring-1 ring-white/15 backdrop-blur-md text-center">
            <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{t("recordingEvidenceActive")}</span>
          </div>
        </div>
      )}

      {/* ── Screen Share Error Toast ───────────────────────────────────────── */}
      {screenShareError && (
        <div className="absolute inset-x-0 top-12 sm:top-14 z-20 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full bg-red-700/90 px-4 py-2 text-white shadow-lg ring-1 ring-white/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-[12px] sm:text-[13px]">{t("screenShareError")}</p>
          </div>
        </div>
      )}

      {/* ── Main Center Area: Video Grid + Collaboration Side Panel ────────── */}
      <div className="relative flex-1 flex overflow-hidden min-h-0">
        {/* Video Grid Container */}
        <div className="flex-1 grid grid-cols-1 grid-rows-2 lg:grid-rows-1 lg:grid-cols-2 auto-rows-fr gap-2 sm:gap-3 p-2 sm:p-4 pt-12 sm:pt-14 min-h-0 transition-all duration-300">
          {/* Remote participants */}
          {remoteParticipants.map((participant) => (
            <div
              key={participant.sid}
              className="relative overflow-hidden rounded-xl bg-gray-900 h-full w-full min-h-0 border border-white/5"
            >
              <video
                ref={(el) => handleRemoteVideoRef(participant.sid, el)}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              <audio
                ref={(el) => setAudioRef(participant.sid, el)}
                autoPlay
              />
              <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 rounded-lg bg-black/70 px-2.5 py-1 backdrop-blur-sm">
                <p className="text-[11px] sm:text-[12px] font-semibold text-white truncate max-w-[200px]">
                  {participant.name || t("participant")}
                </p>
              </div>
            </div>
          ))}

          {/* Local participant */}
          <div className="relative overflow-hidden rounded-xl bg-gray-900 h-full w-full min-h-0 border border-white/5">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${
                !isVideoEnabled ? "hidden" : ""
              }`}
            />
            {!isVideoEnabled && (
              <div className="flex h-full items-center justify-center">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-brand-dark">
                  <VideoOff size={30} className="text-white" />
                </div>
              </div>
            )}
            <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 backdrop-blur-sm">
              <p className="text-[11px] sm:text-[12px] font-semibold text-white">
                {t("you")}
              </p>
              {!isAudioEnabled && (
                <MicOff size={12} className="text-red-400 shrink-0" />
              )}
            </div>
          </div>

          {/* Waiting state with timeout messaging */}
          {remoteParticipants.length === 0 && (
            <div className="flex items-center justify-center rounded-xl bg-gray-900 h-full w-full min-h-0 border border-white/5">
              <div className="text-center px-4 sm:px-6">
                {showWaitingTimeout ? (
                  <>
                    <Clock className="h-9 w-9 sm:h-10 sm:w-10 text-amber-400 mx-auto mb-2.5" />
                    <p className="text-white/80 text-[13px] sm:text-[14px] font-semibold mb-1.5">
                      {isExpert
                        ? t("waitingLongExpert")
                        : t("waitingLongClient")}
                    </p>
                    <p className="text-white/50 text-[11px] sm:text-[12px] mb-3.5 max-w-xs leading-relaxed mx-auto">
                      {t("waitingLongDesc")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white/80 hover:bg-white/10 text-[12px]"
                      onClick={() => setShowLeaveConfirm(true)}
                    >
                      {t("returnToBooking")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-9 w-9 sm:h-10 sm:w-10 animate-spin text-white/30 mx-auto mb-2.5" />
                    <p className="text-white/70 text-[13px] sm:text-[14px]">
                      {isExpert
                        ? t("waitingForClient")
                        : t("waitingForExpert")}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Option B: Collaboration Side Panel (Slide-Over on Mobile, Split on Tablet/Desktop) ── */}
        {activePanel && (
          <div className="absolute inset-0 sm:relative sm:inset-auto w-full sm:w-80 lg:w-96 shrink-0 h-full z-30 flex flex-col bg-gray-950/98 backdrop-blur-md animate-in slide-in-from-right duration-200">
            {activePanel === "chat" && (
              <InRoomChatPanel
                bookingId={bookingId}
                onClose={() => setActivePanel(null)}
                onUnreadChange={setUnreadChatCount}
              />
            )}
            {activePanel === "documents" && (
              <InRoomDocumentsPanel
                bookingId={bookingId}
                onClose={() => setActivePanel(null)}
              />
            )}
            {activePanel === "details" && (
              <InRoomDetailsPanel
                bookingId={bookingId}
                isExpert={isExpert}
                onClose={() => setActivePanel(null)}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Controls Dock (Responsive for Large, Medium, Small & <360px Screens) ── */}
      <div className="border-t border-white/10 bg-black/90 px-2 py-2 sm:px-6 sm:py-3 backdrop-blur-md shrink-0">
        <div className="mx-auto flex flex-wrap sm:flex-nowrap max-w-5xl items-center justify-center sm:justify-between gap-1.5 sm:gap-3">
          {/* Left: Consultation info & active participants (Desktop) */}
          <div className="hidden md:block min-w-0">
            <p className="text-[11px] text-white/50 truncate">
              {t("consultationInProgress")}
            </p>
            <p className="text-[13px] font-semibold text-white">
              {t("participantsCount", {
                count: remoteParticipants.length + 1,
              })}
            </p>
          </div>

          {/* Center: Core Audio/Video/Share/Record/Leave Controls */}
          <div className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5">
            {/* Mute */}
            <Button
              onClick={toggleAudio}
              size="lg"
              className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0 ${
                isAudioEnabled
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
              title={isAudioEnabled ? t("muteLabel") : t("unmuteLabel")}
              aria-label={isAudioEnabled ? t("muteLabel") : t("unmuteLabel")}
              aria-pressed={!isAudioEnabled}
            >
              {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </Button>

            {/* Camera */}
            <Button
              onClick={toggleVideo}
              size="lg"
              className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0 ${
                isVideoEnabled
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
              title={isVideoEnabled ? t("videoOffLabel") : t("videoOnLabel")}
              aria-label={
                isVideoEnabled ? t("videoOffLabel") : t("videoOnLabel")
              }
              aria-pressed={!isVideoEnabled}
            >
              {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            </Button>

            {/* Screen share (tablet & desktop) */}
            <Button
              onClick={toggleScreenShare}
              size="lg"
              className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0 hidden sm:flex ${
                isScreenSharing
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
              title={
                isScreenSharing
                  ? t("stopScreenShareLabel")
                  : t("shareScreenLabel")
              }
              aria-label={
                isScreenSharing
                  ? t("stopScreenShareLabel")
                  : t("shareScreenLabel")
              }
              aria-pressed={isScreenSharing}
            >
              {isScreenSharing ? (
                <MonitorOff size={18} />
              ) : (
                <Monitor size={18} />
              )}
            </Button>

            {/* OD-01: Dispute Evidence Recording */}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="lg"
              className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0 transition-all ${
                isRecording
                  ? "bg-red-600 hover:bg-red-500 ring-2 ring-red-400 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
              title={
                isRecording ? t("stopRecordingLabel") : t("startRecordingLabel")
              }
              aria-label={
                isRecording ? t("stopRecordingLabel") : t("startRecordingLabel")
              }
              aria-pressed={isRecording}
              disabled={isUploadingRecording}
            >
              {isRecording ? (
                <Disc className="animate-spin text-white" size={18} />
              ) : (
                <Disc size={18} />
              )}
            </Button>

            {/* Leave */}
            <Button
              onClick={() => setShowLeaveConfirm(true)}
              size="lg"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0 bg-red-600 hover:bg-red-500 text-white"
              title={t("leaveLabel")}
              aria-label={t("leaveLabel")}
            >
              <PhoneOff size={18} />
            </Button>
          </div>

          {/* Divider on small screens */}
          <div className="h-6 w-px bg-white/10 sm:hidden mx-0.5" />

          {/* Right: Collaboration Panels & Multitasking Toggles */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Chat Toggle Button */}
            <div className="relative">
              <Button
                onClick={() => {
                  setActivePanel((prev) => (prev === "chat" ? null : "chat"));
                  setUnreadChatCount(0);
                }}
                size="sm"
                className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 transition-all ${
                  activePanel === "chat"
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400"
                    : "bg-gray-800 text-white/80 hover:bg-gray-700 hover:text-white"
                }`}
                title={t("inRoomChatToggle")}
                aria-label={t("inRoomChatToggle")}
              >
                <MessageSquare size={16} />
              </Button>
              {unreadChatCount > 0 && activePanel !== "chat" && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white shadow">
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </span>
              )}
            </div>

            {/* Documents Toggle Button */}
            <Button
              onClick={() =>
                setActivePanel((prev) =>
                  prev === "documents" ? null : "documents"
                )
              }
              size="sm"
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 transition-all ${
                activePanel === "documents"
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400"
                  : "bg-gray-800 text-white/80 hover:bg-gray-700 hover:text-white"
              }`}
              title={t("inRoomDocsToggle")}
              aria-label={t("inRoomDocsToggle")}
            >
              <FileText size={16} />
            </Button>

            {/* Details Toggle Button */}
            <Button
              onClick={() =>
                setActivePanel((prev) =>
                  prev === "details" ? null : "details"
                )
              }
              size="sm"
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 transition-all ${
                activePanel === "details"
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400"
                  : "bg-gray-800 text-white/80 hover:bg-gray-700 hover:text-white"
              }`}
              title={t("inRoomDetailsToggle")}
              aria-label={t("inRoomDetailsToggle")}
            >
              <Info size={16} />
            </Button>

            {/* PiP (Picture in Picture) Button */}
            {typeof document !== "undefined" &&
              document.pictureInPictureEnabled && (
                <Button
                  onClick={handleTogglePiP}
                  size="sm"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 bg-gray-800 text-white/80 hover:bg-gray-700 hover:text-white hidden sm:flex"
                  title={t("pipLabel")}
                  aria-label={t("pipLabel")}
                >
                  <PictureInPicture2 size={16} />
                </Button>
              )}

            {/* Minimize / Multitask Button — visible on all devices so mobile & desktop users can browse portal */}
            <Button
              onClick={handleMinimize}
              size="sm"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 bg-gray-800 text-white/80 hover:bg-gray-700 hover:text-white flex"
              title={t("minimizeCall")}
              aria-label={t("minimizeCall")}
            >
              <Minimize2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
