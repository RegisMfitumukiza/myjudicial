"use client";

import { useState, useEffect } from "react";
import {
  Room,
  RoomEvent,
  VideoPresets,
  Track,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from "livekit-client";
import type { RemoteTrack } from "livekit-client";
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
import { useJoinConsultation } from "../hooks/useJoinConsultation";
import { useTranslations } from "next-intl";

interface ConsultationRoomProps {
  bookingId: string;
  onLeave: () => void;
}

export function ConsultationRoom({ bookingId, onLeave }: ConsultationRoomProps) {
  const t = useTranslations("expertDashboard_consultation-room");
  const { mutateAsync: joinConsultation } = useJoinConsultation();

  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<any[]>([]);

  useEffect(() => {
    let roomInstance: Room | null = null;

    async function connectToRoom() {
      try {
        setIsConnecting(true);
        setError(null);

        // Get LiveKit token from backend
        const { token: livekitToken } = await joinConsultation(bookingId);

        // Create room instance
        roomInstance = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
        });

        // Set up event listeners
        roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log("Participant connected:", participant.identity);
          updateParticipants();
        });

        roomInstance.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log("Participant disconnected:", participant.identity);
          updateParticipants();
        });

        roomInstance.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          console.log("Track subscribed:", track.kind, participant.identity);
          attachTrackToElement(track, participant.identity);
          updateParticipants();
        });

        roomInstance.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          console.log("Track unsubscribed:", track.kind);
          detachTrackFromElement(track);
          updateParticipants();
        });

        roomInstance.on(RoomEvent.Disconnected, (reason) => {
          console.log("Disconnected from room:", reason);
          handleLeave();
        });

        // Connect to room
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://localhost:7880";
        await roomInstance.connect(livekitUrl, livekitToken);

        console.log("Connected to room:", roomInstance.name);

        // Create and publish local tracks
        const videoTrack = await createLocalVideoTrack({
          resolution: VideoPresets.h720.resolution,
        });
        const audioTrack = await createLocalAudioTrack();

        await roomInstance.localParticipant.publishTrack(videoTrack);
        await roomInstance.localParticipant.publishTrack(audioTrack);

        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);

        // Attach local video to element
        const localVideoElement = document.getElementById("local-video") as HTMLVideoElement;
        if (localVideoElement && videoTrack) {
          videoTrack.attach(localVideoElement);
        }

        setRoom(roomInstance);
        setIsConnecting(false);

        // Update remote participants
        updateParticipants();

        function updateParticipants() {
          if (!roomInstance) return;
          const participants = Array.from(roomInstance.remoteParticipants.values());
          setRemoteParticipants(participants);
        }
      } catch (err) {
        console.error("Failed to connect to room:", err);
        setError(err instanceof Error ? err.message : "Failed to connect");
        setIsConnecting(false);
      }
    }

    connectToRoom();

    // Cleanup
    return () => {
      if (roomInstance) {
        roomInstance.disconnect();
      }
      if (localVideoTrack) {
        localVideoTrack.stop();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- joinConsultation (from useMutation) is stable; only bookingId should retrigger the connection
  }, [bookingId]);

  function attachTrackToElement(track: RemoteTrack, identity: string) {
    if (track.kind === Track.Kind.Video) {
      const videoElement = document.getElementById(`remote-video-${identity}`) as HTMLVideoElement;
      if (videoElement) {
        track.attach(videoElement);
      }
    } else if (track.kind === Track.Kind.Audio) {
      const audioElement = document.getElementById(`remote-audio-${identity}`) as HTMLAudioElement;
      if (audioElement) {
        track.attach(audioElement);
      }
    }
  }

  function detachTrackFromElement(track: RemoteTrack) {
    track.detach();
  }

  async function toggleAudio() {
    if (localAudioTrack) {
      if (isAudioEnabled) {
        localAudioTrack.mute();
      } else {
        localAudioTrack.unmute();
      }
      setIsAudioEnabled(!isAudioEnabled);
    }
  }

  async function toggleVideo() {
    if (localVideoTrack) {
      if (isVideoEnabled) {
        localVideoTrack.mute();
      } else {
        localVideoTrack.unmute();
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  }

  async function toggleScreenShare() {
    if (!room) return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        await room.localParticipant.setScreenShareEnabled(false);
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        await room.localParticipant.setScreenShareEnabled(true);
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error("Failed to toggle screen share:", err);
    }
  }

  function handleLeave() {
    if (room) {
      room.disconnect();
    }
    onLeave();
  }

  if (isConnecting) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white/50 mx-auto mb-4" />
          <p className="text-white/70 text-[14px]">{t("connectingToConsultation")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black px-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-white text-[18px] font-semibold mb-2">{t("failedToJoin")}</p>
        <p className="text-white/60 text-[13px] mb-6 text-center max-w-md">{error}</p>
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
    <div className="flex h-screen flex-col bg-black">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 gap-2 p-4 lg:grid-cols-2">
        {/* Remote Participants */}
        {remoteParticipants.map((participant) => (
          <div key={participant.sid} className="relative overflow-hidden rounded-xl bg-gray-900">
            <video
              id={`remote-video-${participant.identity}`}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
            <audio id={`remote-audio-${participant.identity}`} autoPlay />
            <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-3 py-1.5">
              <p className="text-[12px] font-semibold text-white">
                {participant.identity}
              </p>
            </div>
          </div>
        ))}

        {/* Local Participant */}
        <div className="relative overflow-hidden rounded-xl bg-gray-900">
          <video
            id="local-video"
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

        {/* Empty state if waiting for expert */}
        {remoteParticipants.length === 0 && (
          <div className="flex items-center justify-center rounded-xl bg-gray-900">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-[14px]">{t("waitingForExpert")}</p>
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
              onClick={toggleAudio}
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
              onClick={toggleVideo}
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
              onClick={toggleScreenShare}
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
