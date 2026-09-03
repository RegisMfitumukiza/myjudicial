"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Mic, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AiVoiceRecorderProps = {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
  isTranscribing?: boolean;
  isRecording?: boolean;
  onRecordingStateChange?: (recording: boolean) => void;
  duration?: number;
  onDurationChange?: (duration: number) => void;
};

export function AiVoiceRecorder({
  onRecordingComplete,
  disabled,
  isTranscribing,
  isRecording: externalIsRecording,
  onRecordingStateChange,
  duration: externalDuration,
  onDurationChange,
}: AiVoiceRecorderProps) {
  const t = useTranslations("ai.voice");
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const [internalDuration, setInternalDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRecording = externalIsRecording ?? internalIsRecording;
  const duration = externalDuration ?? internalDuration;

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        onRecordingComplete(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setInternalIsRecording(true);
      onRecordingStateChange?.(true);
      setInternalDuration(0);
      onDurationChange?.(0);

      intervalRef.current = setInterval(() => {
        setInternalDuration((d) => {
          const next = d + 1;
          onDurationChange?.(next);
          return next;
        });
      }, 1000);
    } catch {
      // Microphone access denied or not available
    }
  }, [onRecordingComplete, onRecordingStateChange, onDurationChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setInternalIsRecording(false);
    onRecordingStateChange?.(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [onRecordingStateChange]);

  const showLoader = isTranscribing && !isRecording;

  return (
    <button
      type="button"
      disabled={disabled || showLoader}
      onClick={isRecording ? stopRecording : startRecording}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200",
        isRecording
          ? "bg-brand-dark text-on-brand"
          : showLoader
            ? "bg-muted text-muted-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        (disabled || showLoader) && "opacity-50 cursor-not-allowed"
      )}
      title={isRecording ? t("stop") : showLoader ? t("processing") : t("recording")}
    >
      {showLoader ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}
