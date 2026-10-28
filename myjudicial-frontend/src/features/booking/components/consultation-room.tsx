"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionQuality,
  RoomEvent,
  Track,
} from "livekit-client";
import type { RemoteParticipant, RemoteTrack, TrackPublication } from "livekit-client";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoomConnection, MAX_REJOIN_ATTEMPTS } from "../hooks/useRoomConnection";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api/client";

// How long to wait (ms) before showing the "other participant hasn't joined" message
const WAITING_TIMEOUT_MS = 3 * 60 * 1000;

interface ConsultationRoomProps {
  bookingId: string;
  onLeave: () => void;
  isExpert?: boolean;
}

export function ConsultationRoom({ bookingId, onLeave, isExpert = false }: ConsultationRoomProps) {
  // Use shared neutral namespace (same keys, avoids coupling to expert dashboard NS)
  const t = useTranslations("expertDashboard_consultation-room");

  const {
    status,
    error,
    room,
    localVideoTrack,
    localAudioTrack,
    remoteParticipants,
    connectionQuality,
    rejoinAttempt,
    leave,
  } = useRoomConnection(bookingId);

  // ── F-06: Derive mute state from actual track publications ───────────────
  // This prevents desync after reconnect (local state was never reset).
  const isAudioEnabled = localAudioTrack ? !localAudioTrack.isMuted : true;
  const isVideoEnabled = localVideoTrack ? !localVideoTrack.isMuted : true;

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareError, setScreenShareError] = useState(false);

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
    } else {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      setWaitingTooLong(false);
    }
    return () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
    };
  }, [status, remoteParticipants.length]);

  // ── Local video attachment ────────────────────────────────────────────────
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!localVideoTrack || !localVideoRef.current) return;
    localVideoTrack.attach(localVideoRef.current);
    return () => {
      localVideoTrack.detach();
    };
  }, [localVideoTrack]);

  // ── F-05: Track subscription race fix ────────────────────────────────────
  // Keep a pending map for tracks that arrive before their <video> ref is mounted.
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const pendingVideoTracks = useRef<Record<string, RemoteTrack>>({});

  // Callback-ref for video elements: attaches pending tracks as soon as the
  // DOM node is available, eliminating the race between TrackSubscribed and mount.
  const setVideoRef = useCallback((sid: string, el: HTMLVideoElement | null) => {
    videoRefs.current[sid] = el;
    if (el && pendingVideoTracks.current[sid]) {
      pendingVideoTracks.current[sid].attach(el);
      delete pendingVideoTracks.current[sid];
    }
  }, []);

  useEffect(() => {
    if (!room) return;

    const onSubscribed = (track: RemoteTrack, _pub: TrackPublication, participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Video) {
        const el = videoRefs.current[participant.sid];
        if (el) {
          track.attach(el);
        } else {
          // Element not mounted yet — store for callback-ref to attach
          pendingVideoTracks.current[participant.sid] = track;
        }
      } else if (track.kind === Track.Kind.Audio) {
        const el = audioRefs.current[participant.sid];
        if (el) track.attach(el);
      }
    };

    const onUnsubscribed = (track: RemoteTrack, _pub: TrackPublication, participant: RemoteParticipant) => {
      track.detach();
      delete pendingVideoTracks.current[participant.sid];
    };

    room.on(RoomEvent.TrackSubscribed, onSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onUnsubscribed);
    return () => {
      room.off(RoomEvent.TrackSubscribed, onSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onUnsubscribed);
    };
  }, [room]);

  // Autoplay gate — resume audio context on first user interaction
  useEffect(() => {
    if (!room || status !== "connected") return;
    const onGesture = () => { room.startAudio(); };
    window.addEventListener("pointerdown", onGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onGesture);
  }, [room, status]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  // ── OD-01: Dispute evidence video recording ───────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [recordingSaved, setRecordingSaved] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping MediaRecorder:", err);
      }
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      console.warn("MediaRecorder is not supported in this browser environment.");
      return;
    }

    try {
      const stream = new MediaStream();
      if (localVideoTrack?.mediaStreamTrack) {
        stream.addTrack(localVideoTrack.mediaStreamTrack);
      }
      if (localAudioTrack?.mediaStreamTrack) {
        stream.addTrack(localAudioTrack.mediaStreamTrack);
      }

      remoteParticipants.forEach((p) => {
        p.trackPublications.forEach((pub) => {
          if (pub.track?.mediaStreamTrack) {
            if (pub.track.kind === Track.Kind.Audio) {
              stream.addTrack(pub.track.mediaStreamTrack);
            } else if (stream.getVideoTracks().length === 0 && pub.track.kind === Track.Kind.Video) {
              stream.addTrack(pub.track.mediaStreamTrack);
            }
          }
        });
      });

      if (stream.getTracks().length === 0) {
        console.warn("No active tracks available to record.");
        return;
      }

      let mimeType = "";
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
        mimeType = "video/webm;codecs=vp8,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const durationSec = recordingStartRef.current
          ? Math.round((Date.now() - recordingStartRef.current) / 1000)
          : 0;
        const chunks = recordedChunksRef.current;
        if (chunks.length === 0) return;

        const blobType = mimeType || recorder.mimeType || "video/webm";
        const blob = new Blob(chunks, { type: blobType });

        setIsUploadingRecording(true);
        try {
          const formData = new FormData();
          const ext = blobType.includes("mp4") ? "mp4" : "webm";
          formData.append("recording", blob, `evidence-${bookingId}-${Date.now()}.${ext}`);
          formData.append("durationSec", String(durationSec));

          await apiFetch(`/api/v1/bookings/${bookingId}/recording/evidence`, {
            method: "POST",
            body: formData,
          });
          setRecordingSaved(true);
          setTimeout(() => setRecordingSaved(false), 5000);
        } catch (err) {
          console.error("Failed to upload consultation recording evidence:", err);
        } finally {
          setIsUploadingRecording(false);
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      recordingStartRef.current = Date.now();
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
    }
  }, [localVideoTrack, localAudioTrack, remoteParticipants, bookingId]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore unmount stop errors
        }
      }
    };
  }, []);

  const handleLeave = () => {
    if (isRecording) {
      stopRecording();
    }
    leave();
    onLeave();
  };

  const handleMuteToggle = async () => {
    if (!localAudioTrack) return;
    if (isAudioEnabled) {
      await localAudioTrack.mute();
    } else {
      await localAudioTrack.unmute();
    }
    // No local state to set — isAudioEnabled derives from track.isMuted
  };

  const handleVideoToggle = async () => {
    if (!localVideoTrack) return;
    if (isVideoEnabled) {
      await localVideoTrack.mute();
    } else {
      await localVideoTrack.unmute();
    }
  };

  // ── Connection quality label map ──────────────────────────────────────────
  const qualityInfo: Record<ConnectionQuality, { label: string; dot: string }> = {
    [ConnectionQuality.Excellent]: { label: t("qualityExcellent"), dot: "bg-emerald-400" },
    [ConnectionQuality.Good]:      { label: t("qualityGood"),      dot: "bg-brand-dark dark:bg-white" },
    [ConnectionQuality.Poor]:      { label: t("qualityPoor"),      dot: "bg-amber-400" },
    [ConnectionQuality.Lost]:      { label: t("qualityLost"),      dot: "bg-red-400" },
    [ConnectionQuality.Unknown]:   { label: "",                    dot: "bg-gray-400" },
  };
  const quality = qualityInfo[connectionQuality];

  const errorMessage =
    error === "connectionLost"      ? t("connectionLost") :
    error === "failedToJoin"        ? t("failedToJoin") :
    error === "roomDeleted"         ? t("roomDeleted") :
    error === "serverShutdown"      ? t("serverShutdown") :
    error === "participantRemoved"  ? t("participantRemoved") :
    error === "duplicateIdentity"   ? t("duplicateIdentity") :
    (error                          ? t("connectionError") : "");

  // ── Loading state ─────────────────────────────────────────────────────────
  if (status === "connecting") {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white/50 mx-auto mb-4" />
          <p className="text-white/70 text-[14px]">{t("connectingToConsultation")}</p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black px-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-white text-[18px] font-semibold mb-2">{t("connectionError")}</p>
        <p className="text-white/60 text-[13px] mb-6 text-center max-w-md">{errorMessage}</p>
        <Button
          onClick={onLeave}
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
    <div className="relative flex h-screen flex-col bg-black overflow-hidden">

      {/* ── F-11: Leave Confirmation Dialog ───────────────────────────────── */}
      {showLeaveConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-white/10 p-6 shadow-2xl">
            <p className="text-white text-[16px] font-semibold mb-2">{t("leaveConfirmTitle")}</p>
            <p className="text-white/60 text-[13px] mb-6 leading-relaxed">{t("leaveConfirmDesc")}</p>
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
        <div className="absolute inset-x-0 top-4 z-10 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full bg-brand-dark px-4 py-2 text-white shadow-lg ring-1 ring-white/20">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <p className="text-[13px]">
              {rejoinAttempt > 0
                ? t("reconnectingAttempt", { count: rejoinAttempt, max: MAX_REJOIN_ATTEMPTS })
                : t("reconnecting")}
            </p>
          </div>
        </div>
      )}

      {/* ── OD-01: Recording / Status / Connection Quality Indicators ───── */}
      <div className="absolute inset-x-0 top-4 z-10 flex items-center justify-between px-6 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {isRecording && (
            <div className="flex items-center gap-2 rounded-full bg-red-950/85 border border-red-500/40 px-3 py-1.5 text-white backdrop-blur-sm shadow-md animate-pulse">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-[12px] font-medium tracking-wide text-red-100">
                REC {Math.floor(recordingSeconds / 60).toString().padStart(2, "0")}:{(recordingSeconds % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
          {isUploadingRecording && (
            <div className="flex items-center gap-2 rounded-full bg-blue-950/85 border border-blue-500/30 px-3 py-1.5 text-white backdrop-blur-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
              <span className="text-[12px] text-blue-200">{t("uploadingEvidence")}</span>
            </div>
          )}
          {recordingSaved && (
            <div className="flex items-center gap-2 rounded-full bg-emerald-950/85 border border-emerald-500/30 px-3 py-1.5 text-white backdrop-blur-sm">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[12px] text-emerald-200">{t("recordingEvidenceSaved")}</span>
            </div>
          )}
        </div>

        {/* F-12: Connection quality indicator (ring for dark-bg contrast) */}
        {status === "connected" && connectionQuality !== ConnectionQuality.Unknown && (
          <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-white backdrop-blur-sm ring-1 ring-white/10 pointer-events-auto">
            <span className={`h-2 w-2 rounded-full ${quality.dot}`} />
            <p className="text-[12px]">{quality.label}</p>
          </div>
        )}
      </div>

      {/* ── OD-01: Dispute Evidence Banner ─────────────────────────────────── */}
      {isRecording && (
        <div className="absolute inset-x-0 top-14 z-10 flex justify-center px-4 pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-black/85 px-4 py-1.5 text-white/90 text-[12px] shadow-lg ring-1 ring-white/15 backdrop-blur-md">
            <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{t("recordingEvidenceActive")}</span>
          </div>
        </div>
      )}

      {/* ── F-10: Screen share error toast ────────────────────────────────── */}
      {screenShareError && (
        <div className="absolute inset-x-0 top-14 z-10 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full bg-red-700/90 px-4 py-2 text-white shadow-lg ring-1 ring-white/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-[13px]">{t("screenShareError")}</p>
          </div>
        </div>
      )}

      {/* ── Video grid ────────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 grid-rows-2 lg:grid-rows-1 lg:grid-cols-2 auto-rows-fr gap-2 sm:gap-3 p-2 sm:p-4 min-h-0">

        {/* Remote participants */}
        {remoteParticipants.map((participant) => (
          <div key={participant.sid} className="relative overflow-hidden rounded-xl bg-gray-900 h-full w-full min-h-0">
            <video
              ref={(el) => setVideoRef(participant.sid, el)}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
            <audio
              ref={(el) => { audioRefs.current[participant.sid] = el; }}
              autoPlay
            />
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-[12px] font-semibold text-white">
                {participant.name || t("participant")}
              </p>
            </div>
          </div>
        ))}

        {/* Local participant */}
        <div className="relative overflow-hidden rounded-xl bg-gray-900 h-full w-full min-h-0">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${!isVideoEnabled ? "hidden" : ""}`}
          />
          {!isVideoEnabled && (
            <div className="flex h-full items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-dark">
                <VideoOff size={36} className="text-white" />
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-sm">
            <p className="text-[12px] font-semibold text-white">{t("you")}</p>
          </div>
        </div>

        {/* ── F-07: Waiting state with timeout messaging ─────────────────── */}
        {remoteParticipants.length === 0 && (
          <div className="flex items-center justify-center rounded-xl bg-gray-900 h-full w-full min-h-0">
            <div className="text-center px-6">
              {waitingTooLong ? (
                <>
                  <Clock className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-white/80 text-[14px] font-semibold mb-2">
                    {isExpert ? t("waitingLongExpert") : t("waitingLongClient")}
                  </p>
                  <p className="text-white/50 text-[12px] mb-4 max-w-xs leading-relaxed">
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
                  <Loader2 className="h-10 w-10 animate-spin text-white/30 mx-auto mb-3" />
                  <p className="text-white/70 text-[14px]">
                    {isExpert ? t("waitingForClient") : t("waitingForExpert")}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10 bg-black/80 px-4 py-3 sm:px-6 sm:py-4 pb-6 sm:pb-4 backdrop-blur-md shrink-0">
        <div className="mx-auto flex max-w-4xl items-center justify-center sm:justify-between">

          {/* Left — room info (hidden on mobile, visible on tablet/desktop) */}
          <div className="hidden sm:block min-w-0">
            <p className="text-[11px] text-white/50 truncate">{t("consultationInProgress")}</p>
            <p className="text-[13px] font-semibold text-white">{t("participantsCount", { count: remoteParticipants.length + 1 })}</p>
          </div>

          {/* Center — call controls (centered for clean thumb reach) */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3">
            {/* Mute */}
            <Button
              onClick={handleMuteToggle}
              size="lg"
              className={`h-12 w-12 rounded-full ${
                isAudioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-500"
              }`}
              title={isAudioEnabled ? t("muteLabel") : t("unmuteLabel")}
              aria-label={isAudioEnabled ? t("muteLabel") : t("unmuteLabel")}
              aria-pressed={!isAudioEnabled}
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </Button>

            {/* Camera */}
            <Button
              onClick={handleVideoToggle}
              size="lg"
              className={`h-12 w-12 rounded-full ${
                isVideoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-500"
              }`}
              title={isVideoEnabled ? t("videoOffLabel") : t("videoOnLabel")}
              aria-label={isVideoEnabled ? t("videoOffLabel") : t("videoOnLabel")}
              aria-pressed={!isVideoEnabled}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </Button>

            {/* Screen share — strictly desktop/tablet */}
            <Button
              onClick={async () => {
                if (!room) return;
                setScreenShareError(false);
                try {
                  if (isScreenSharing) {
                    await room.localParticipant.setScreenShareEnabled(false);
                    setIsScreenSharing(false);
                  } else {
                    await room.localParticipant.setScreenShareEnabled(true);
                    setIsScreenSharing(true);
                  }
                } catch (err) {
                  console.error("Failed to toggle screen share:", err);
                  setScreenShareError(true);
                  // Auto-clear toast after 4s
                  setTimeout(() => setScreenShareError(false), 4000);
                }
              }}
              size="lg"
              className={`h-12 w-12 rounded-full hidden sm:flex ${
                isScreenSharing ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={isScreenSharing ? t("stopScreenShareLabel") : t("shareScreenLabel")}
              aria-label={isScreenSharing ? t("stopScreenShareLabel") : t("shareScreenLabel")}
              aria-pressed={isScreenSharing}
            >
              {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            </Button>

            {/* OD-01: Dispute Evidence Recording */}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="lg"
              className={`h-12 w-12 rounded-full transition-all ${
                isRecording
                  ? "bg-red-600 hover:bg-red-500 ring-2 ring-red-400"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
              title={isRecording ? t("stopRecordingLabel") : t("startRecordingLabel")}
              aria-label={isRecording ? t("stopRecordingLabel") : t("startRecordingLabel")}
              aria-pressed={isRecording}
              disabled={isUploadingRecording}
            >
              {isRecording ? <Disc className="animate-spin text-white" size={20} /> : <Disc size={20} />}
            </Button>

            {/* Leave — F-11: opens confirmation instead of immediate leave */}
            <Button
              onClick={() => setShowLeaveConfirm(true)}
              size="lg"
              className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-500"
              title={t("leaveLabel")}
              aria-label={t("leaveLabel")}
            >
              <PhoneOff size={20} />
            </Button>
          </div>

          {/* Right — spacer (hidden on mobile) */}
          <div className="hidden sm:block w-16 sm:w-24" />
        </div>
      </div>
    </div>
  );
}
