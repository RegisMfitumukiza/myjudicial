"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ConnectionQuality,
  DisconnectReason,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
} from "livekit-client";
import type {
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  TrackPublication,
} from "livekit-client";
import { useJoinConsultation } from "../hooks/useJoinConsultation";
import { apiFetch } from "@/lib/api/client";

export type RoomConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export const MAX_REJOIN_ATTEMPTS = 2;
const REJOIN_DELAY_MS = 3000;
const LIVEKIT_URL =
  process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://localhost:7880";

function createRoomInstance(): Room {
  return new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    },
  });
}

export interface ActiveConsultationContextType {
  activeBookingId: string | null;
  status: RoomConnectionStatus;
  error: string | null;
  room: Room | null;
  localVideoTrack: LocalVideoTrack | null;
  localAudioTrack: LocalAudioTrack | null;
  remoteParticipants: RemoteParticipant[];
  connectionQuality: ConnectionQuality;
  rejoinAttempt: number;
  callDurationSeconds: number;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;

  // Media state & controls
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  screenShareError: boolean;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;

  // Dispute evidence recording (OD-01)
  isRecording: boolean;
  recordingSeconds: number;
  isUploadingRecording: boolean;
  recordingSaved: boolean;
  startRecording: () => void;
  stopRecording: () => void;

  // Connection lifecycle
  joinCall: (bookingId: string) => Promise<void>;
  leaveCall: () => void;

  // Track management
  setVideoRef: (sid: string, el: HTMLVideoElement | null) => void;
  setAudioRef: (sid: string, el: HTMLAudioElement | null) => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteAudioSinkRef: React.RefObject<HTMLAudioElement | null>;
}

const ActiveConsultationContext =
  createContext<ActiveConsultationContextType | null>(null);

export function ActiveConsultationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mutateAsync: joinConsultation } = useJoinConsultation();

  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [status, setStatus] = useState<RoomConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<LocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<LocalAudioTrack | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<
    RemoteParticipant[]
  >([]);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(
    ConnectionQuality.Unknown
  );
  const [rejoinAttempt, setRejoinAttempt] = useState(0);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareError, setScreenShareError] = useState(false);

  // Dispute evidence recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [recordingSaved, setRecordingSaved] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const generationRef = useRef(0);
  const rejoinCountRef = useRef(0);
  const rejoinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioSinkRef = useRef<HTMLAudioElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const pendingVideoTracks = useRef<Record<string, RemoteTrack>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive mute state directly from local tracks
  const isAudioEnabled = localAudioTrack ? !localAudioTrack.isMuted : true;
  const isVideoEnabled = localVideoTrack ? !localVideoTrack.isMuted : true;

  const updateParticipants = useCallback((r: Room | null) => {
    if (!r) {
      setRemoteParticipants([]);
      return;
    }
    setRemoteParticipants(Array.from(r.remoteParticipants.values()));
  }, []);

  const getLocalTracks = useCallback((r: Room) => {
    const videoPub = r.localParticipant.getTrackPublication(
      Track.Source.Camera
    );
    const audioPub = r.localParticipant.getTrackPublication(
      Track.Source.Microphone
    );
    return {
      videoTrack: (videoPub?.track as LocalVideoTrack | undefined) ?? null,
      audioTrack: (audioPub?.track as LocalAudioTrack | undefined) ?? null,
    };
  }, []);

  // Track attachment callback
  const setVideoRef = useCallback(
    (sid: string, el: HTMLVideoElement | null) => {
      videoRefs.current[sid] = el;
      if (el && pendingVideoTracks.current[sid]) {
        pendingVideoTracks.current[sid].attach(el);
        delete pendingVideoTracks.current[sid];
      }
    },
    []
  );

  const setAudioRef = useCallback(
    (sid: string, el: HTMLAudioElement | null) => {
      audioRefs.current[sid] = el;
    },
    []
  );

  // Call duration timer
  useEffect(() => {
    if (status === "connected") {
      durationTimerRef.current = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (status === "idle") {
        setCallDurationSeconds(0);
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [status]);

  // Autoplay gate: ensure audio context is started on user gesture
  useEffect(() => {
    if (!room || status !== "connected") return;
    const onGesture = () => {
      room.startAudio();
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onGesture);
  }, [room, status]);

  // Track subscription listener for room
  useEffect(() => {
    if (!room) return;

    const onSubscribed = (
      track: RemoteTrack,
      _pub: TrackPublication,
      participant: RemoteParticipant
    ) => {
      if (track.kind === Track.Kind.Video) {
        const el = videoRefs.current[participant.sid];
        if (el) {
          track.attach(el);
        } else {
          pendingVideoTracks.current[participant.sid] = track;
        }
      } else if (track.kind === Track.Kind.Audio) {
        const el = audioRefs.current[participant.sid];
        if (el) {
          track.attach(el);
        } else if (remoteAudioSinkRef.current) {
          // Attach to persistent audio sink so audio plays during navigation
          track.attach(remoteAudioSinkRef.current);
        }
      }
    };

    const onUnsubscribed = (
      track: RemoteTrack,
      _pub: TrackPublication,
      participant: RemoteParticipant
    ) => {
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

  // Join Call
  const joinCall = useCallback(
    async (bookingId: string) => {
      // If already connected to this same booking, just un-minimize
      if (roomRef.current && activeBookingId === bookingId && status === "connected") {
        setIsMinimized(false);
        return;
      }

      // If connected to another booking, cleanly disconnect first
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }

      setActiveBookingId(bookingId);
      setStatus("connecting");
      setError(null);
      setIsMinimized(false);
      setCallDurationSeconds(0);

      const gen = ++generationRef.current;

      const attemptNext = () => {
        setStatus("reconnecting");
        if (rejoinCountRef.current < MAX_REJOIN_ATTEMPTS) {
          rejoinCountRef.current += 1;
          setRejoinAttempt(rejoinCountRef.current);
          rejoinTimerRef.current = setTimeout(() => {
            void joinCall(bookingId).catch(() => {});
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
    [activeBookingId, getLocalTracks, joinConsultation, status, updateParticipants]
  );

  // Leave Call
  const leaveCall = useCallback(() => {
    generationRef.current += 1;
    if (rejoinTimerRef.current) {
      clearTimeout(rejoinTimerRef.current);
      rejoinTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (localVideoTrack) {
      localVideoTrack.detach();
      localVideoTrack.stop();
    }
    if (localAudioTrack) {
      localAudioTrack.stop();
    }

    roomRef.current?.disconnect();
    roomRef.current = null;
    setRoom(null);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setRemoteParticipants([]);
    setStatus("idle");
    setActiveBookingId(null);
    setIsMinimized(false);
    setIsRecording(false);
    setIsScreenSharing(false);
    setCallDurationSeconds(0);
  }, [localAudioTrack, localVideoTrack]);

  // Toggle Audio
  const toggleAudio = useCallback(async () => {
    if (!localAudioTrack) return;
    if (isAudioEnabled) {
      await localAudioTrack.mute();
    } else {
      await localAudioTrack.unmute();
    }
  }, [isAudioEnabled, localAudioTrack]);

  // Toggle Video
  const toggleVideo = useCallback(async () => {
    if (!localVideoTrack) return;
    if (isVideoEnabled) {
      await localVideoTrack.mute();
    } else {
      await localVideoTrack.unmute();
    }
  }, [isVideoEnabled, localVideoTrack]);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
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
      setTimeout(() => setScreenShareError(false), 4000);
    }
  }, [isScreenSharing, room]);

  // Stop Recording
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

  // Start Recording
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
          formData.append("recording", blob, `evidence-${activeBookingId}-${Date.now()}.${ext}`);
          formData.append("durationSec", String(durationSec));

          await apiFetch(`/api/v1/bookings/${activeBookingId}/recording/evidence`, {
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
  }, [activeBookingId, localAudioTrack, localVideoTrack, remoteParticipants]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      leaveCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ActiveConsultationContext.Provider
      value={{
        activeBookingId,
        status,
        error,
        room,
        localVideoTrack,
        localAudioTrack,
        remoteParticipants,
        connectionQuality,
        rejoinAttempt,
        callDurationSeconds,
        isMinimized,
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
        remoteAudioSinkRef,
      }}
    >
      {children}
      {/* Persistent hidden audio sink for remote audio while navigating outside join route */}
      <audio ref={remoteAudioSinkRef} autoPlay playsInline className="hidden" />
    </ActiveConsultationContext.Provider>
  );
}

export function useActiveConsultation() {
  const context = useContext(ActiveConsultationContext);
  if (!context) {
    throw new Error(
      "useActiveConsultation must be used within an ActiveConsultationProvider"
    );
  }
  return context;
}
