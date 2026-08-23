"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionQuality,
  DisconnectReason,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
} from "livekit-client";
import type { LocalAudioTrack, LocalVideoTrack, RemoteParticipant } from "livekit-client";
import { useJoinConsultation } from "./useJoinConsultation";

export type RoomConnectionStatus = "connecting" | "connected" | "reconnecting" | "error";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://localhost:7880";
export const MAX_REJOIN_ATTEMPTS = 2;
const REJOIN_DELAY_MS = 3000;

function createRoomInstance(): Room {
  return new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    },
  });
}

export function useRoomConnection(bookingId: string) {
  const { mutateAsync: joinConsultation } = useJoinConsultation();

  const [status, setStatus] = useState<RoomConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(ConnectionQuality.Unknown);
  const [rejoinAttempt, setRejoinAttempt] = useState(0);

  const roomRef = useRef<Room | null>(null);
  const generationRef = useRef(0);
  const rejoinCountRef = useRef(0);
  const rejoinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest attemptJoin, for self-referential retry scheduling. The timer
  // callback resolves it at fire time instead of capturing the variable
  // before its own declaration completes.
  const attemptJoinRef = useRef<((gen: number, isInitial?: boolean) => Promise<void>) | null>(null);

  const updateParticipants = useCallback((r: Room | null) => {
    if (!r) return;
    setRemoteParticipants(Array.from(r.remoteParticipants.values()));
  }, []);

  const getLocalTracks = useCallback((r: Room) => {
    const videoPub = r.localParticipant.getTrackPublication(Track.Source.Camera);
    const audioPub = r.localParticipant.getTrackPublication(Track.Source.Microphone);
    return {
      videoTrack: (videoPub?.track as LocalVideoTrack | undefined) ?? null,
      audioTrack: (audioPub?.track as LocalAudioTrack | undefined) ?? null,
    };
  }, []);

  const attemptJoin = useCallback(
    async (gen: number, isInitial = false) => {
      if (!isInitial) setStatus("reconnecting");
      setError(null);

      const attemptNext = () => {
        setStatus("reconnecting");
        if (rejoinCountRef.current < MAX_REJOIN_ATTEMPTS) {
          rejoinCountRef.current += 1;
          setRejoinAttempt(rejoinCountRef.current);
          rejoinTimerRef.current = setTimeout(() => {
            void attemptJoinRef.current?.(gen).catch(() => {});
          }, REJOIN_DELAY_MS);
        } else {
          setError("connectionLost");
          setStatus("error");
        }
      };

      try {
        const { token } = await joinConsultation(bookingId);
        if (gen !== generationRef.current) return;

        const r = createRoomInstance();
        roomRef.current = r;
        setRoom(r);

        r.on(RoomEvent.ParticipantConnected, () => updateParticipants(r));
        r.on(RoomEvent.ParticipantDisconnected, () => updateParticipants(r));
        r.on(RoomEvent.TrackSubscribed, () => updateParticipants(r));
        r.on(RoomEvent.TrackUnsubscribed, () => updateParticipants(r));
        r.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
          if (participant && participant !== r.localParticipant) return;
          setConnectionQuality(quality);
        });
        r.on(RoomEvent.Reconnecting, () => setStatus("reconnecting"));
        r.on(RoomEvent.SignalReconnecting, () => setStatus("reconnecting"));
        r.on(RoomEvent.Reconnected, () => setStatus("connected"));
        r.on(RoomEvent.Disconnected, (reason) => {
          if (reason === DisconnectReason.CLIENT_INITIATED) return;
          if (gen !== generationRef.current) return;
          console.warn("Room disconnected, reconnecting:", reason);
          attemptNext();
        });

        await r.connect(LIVEKIT_URL, token);
        if (gen !== generationRef.current) return;

        await r.localParticipant.enableCameraAndMicrophone();
        if (gen !== generationRef.current) return;

        const { videoTrack, audioTrack } = getLocalTracks(r);
        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);
        setStatus("connected");
        setRejoinAttempt(0);
        rejoinCountRef.current = 0;
        updateParticipants(r);
      } catch (err) {
        console.error("Failed to connect to room:", err);
        if (gen !== generationRef.current) return;
        attemptNext();
      }
    },
    [bookingId, getLocalTracks, joinConsultation, updateParticipants]
  );

  useEffect(() => {
    attemptJoinRef.current = attemptJoin;
    return () => {
      attemptJoinRef.current = null;
    };
  }, [attemptJoin]);

  useEffect(() => {
    const gen = ++generationRef.current;
    attemptJoin(gen, true).catch(() => {});

    return () => {
      generationRef.current += 1;
      if (rejoinTimerRef.current) {
        clearTimeout(rejoinTimerRef.current);
        rejoinTimerRef.current = null;
      }
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const leave = useCallback(() => {
    generationRef.current += 1;
    if (rejoinTimerRef.current) {
      clearTimeout(rejoinTimerRef.current);
      rejoinTimerRef.current = null;
    }
    roomRef.current?.disconnect();
    roomRef.current = null;
  }, []);

  return {
    status,
    error,
    room,
    localVideoTrack,
    localAudioTrack,
    remoteParticipants,
    connectionQuality,
    rejoinAttempt,
    leave,
  };
}
