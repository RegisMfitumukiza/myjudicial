"use client";

import { useEffect, useRef, useState } from "react";
import {
  ConnectionQuality,
  RoomEvent,
  Track,
} from "livekit-client";
import type { RemoteParticipant, RemoteTrack } from "livekit-client";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoomConnection, MAX_REJOIN_ATTEMPTS } from "../hooks/useRoomConnection";
import { useTranslations } from "next-intl";

interface ConsultationRoomProps {
  bookingId: string;
  onLeave: () => void;
  isExpert?: boolean;
}

export function ConsultationRoom({ bookingId, onLeave, isExpert = false }: ConsultationRoomProps) {
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

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  useEffect(() => {
    if (!localVideoTrack || !localVideoRef.current) return;
    localVideoTrack.attach(localVideoRef.current);
    return () => {
      localVideoTrack.detach();
    };
  }, [localVideoTrack]);

  useEffect(() => {
    if (!room) return;
    const onSubscribed = (track: RemoteTrack, _publication: unknown, participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Video) {
        const el = videoRefs.current[participant.sid];
        if (el) track.attach(el);
      } else if (track.kind === Track.Kind.Audio) {
        const el = audioRefs.current[participant.sid];
        if (el) track.attach(el);
      }
    };
    const onUnsubscribed = (track: RemoteTrack) => {
      track.detach();
    };
    room.on(RoomEvent.TrackSubscribed, onSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onUnsubscribed);
    return () => {
      room.off(RoomEvent.TrackSubscribed, onSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onUnsubscribed);
    };
  }, [room]);

  useEffect(() => {
    if (!room || status !== "connected") return;
    const onGesture = () => {
      room.startAudio();
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onGesture);
  }, [room, status]);

  const handleLeave = () => {
    leave();
    onLeave();
  };

  const qualityInfo: Record<ConnectionQuality, { label: string; dot: string }> = {
    [ConnectionQuality.Excellent]: { label: t("qualityExcellent"), dot: "bg-emerald-400" },
    [ConnectionQuality.Good]: { label: t("qualityGood"), dot: "bg-brand-dark" },
    [ConnectionQuality.Poor]: { label: t("qualityPoor"), dot: "bg-amber-400" },
    [ConnectionQuality.Lost]: { label: t("qualityLost"), dot: "bg-red-400" },
    [ConnectionQuality.Unknown]: { label: "", dot: "bg-gray-400" },
  };
  const quality = qualityInfo[connectionQuality];
  const errorMessage = error === "connectionLost" ? t("connectionLost") : error;

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

  return (
    <div className="relative flex h-screen flex-col bg-black">
      {/* Reconnecting banner */}
      {status === "reconnecting" && (
        <div className="absolute inset-x-0 top-4 z-10 flex justify-center">
          <div className="flex items-center gap-2 rounded-full bg-brand-dark px-4 py-2 text-white shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-[13px]">
              {rejoinAttempt > 0
                ? t("reconnectingAttempt", { count: rejoinAttempt, max: MAX_REJOIN_ATTEMPTS })
                : t("reconnecting")}
            </p>
          </div>
        </div>
      )}

      {/* Connection quality indicator */}
      {status === "connected" && connectionQuality !== ConnectionQuality.Unknown && (
        <div className="absolute inset-x-0 top-4 z-10 flex justify-end px-6">
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-white backdrop-blur-sm">
            <span className={`h-2 w-2 rounded-full ${quality.dot}`} />
            <p className="text-[12px]">{quality.label}</p>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 gap-2 p-4 lg:grid-cols-2">
        {/* Remote Participants */}
        {remoteParticipants.map((participant) => (
          <div key={participant.sid} className="relative overflow-hidden rounded-xl bg-gray-900">
            <video
              ref={(el) => {
                videoRefs.current[participant.sid] = el;
              }}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
            <audio
              ref={(el) => {
                audioRefs.current[participant.sid] = el;
              }}
              autoPlay
            />
            <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-3 py-1.5">
              <p className="text-[12px] font-semibold text-white">
                {participant.name || t("participant")}
              </p>
            </div>
          </div>
        ))}

        {/* Local Participant */}
        <div className="relative overflow-hidden rounded-xl bg-gray-900">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${!isVideoEnabled ? "hidden" : ""}`}
          />
          {!isVideoEnabled && (
            <div className="flex h-full items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-dark">
                <VideoOff size={40} className="text-white" />
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-3 py-1.5">
            <p className="text-[12px] font-semibold text-white">{t("you")}</p>
          </div>
        </div>

        {/* Empty state if waiting for other participant */}
        {remoteParticipants.length === 0 && (
          <div className="flex items-center justify-center rounded-xl bg-gray-900">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-[14px]">
                {isExpert ? t("waitingForClient") : t("waitingForExpert")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-white/10 bg-black/50 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Left - Room Info */}
          <div>
            <p className="text-[12px] text-white/50">{t("consultationInProgress")}</p>
            <p className="text-[14px] font-semibold text-white">{t("participantsCount", { count: remoteParticipants.length + 1 })}</p>
          </div>

          {/* Center - Call Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={async () => {
                if (!localAudioTrack) return;
                if (isAudioEnabled) {
                  await localAudioTrack.mute();
                } else {
                  await localAudioTrack.unmute();
                }
                setIsAudioEnabled(!isAudioEnabled);
              }}
              size="lg"
              className={`h-12 w-12 rounded-full ${
                isAudioEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </Button>

            <Button
              onClick={async () => {
                if (!localVideoTrack) return;
                if (isVideoEnabled) {
                  await localVideoTrack.mute();
                } else {
                  await localVideoTrack.unmute();
                }
                setIsVideoEnabled(!isVideoEnabled);
              }}
              size="lg"
              className={`h-12 w-12 rounded-full ${
                isVideoEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </Button>

            <Button
              onClick={async () => {
                if (!room) return;
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
                }
              }}
              size="lg"
              className={`h-12 w-12 rounded-full ${
                isScreenSharing
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            </Button>

            <Button
              onClick={handleLeave}
              size="lg"
              className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-500"
            >
              <PhoneOff size={20} />
            </Button>
          </div>

          {/* Right - Placeholder for future features */}
          <div className="w-24" />
        </div>
      </div>
    </div>
  );
}
