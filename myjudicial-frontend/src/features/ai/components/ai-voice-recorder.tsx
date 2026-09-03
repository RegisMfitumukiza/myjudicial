"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AiVoiceRecorderProps = {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
  isTranscribing?: boolean;
};

export function AiVoiceRecorder({ onRecordingComplete, disabled, isTranscribing }: AiVoiceRecorderProps) {
  const t = useTranslations("ai.voice");
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setIsRecording(true);
      setDuration(0);

      intervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      // Microphone access denied or not available
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const showLoader = isTranscribing && !isRecording;

  return (
    <button
      type="button"
      disabled={disabled || showLoader}
      onClick={isRecording ? stopRecording : startRecording}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
        isRecording
          ? "bg-gray-700 text-gray-300"
          : showLoader
            ? "bg-brand-dark text-on-brand"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        (disabled || showLoader) && "opacity-50 cursor-not-allowed"
      )}
      title={isRecording ? t("stop") : showLoader ? t("processing") : t("recording")}
    >
      {isRecording && (
        <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
      )}
      {isRecording ? (
        <div className="relative z-10 flex items-center gap-1.5">
          <Square className="h-3 w-3" fill="currentColor" />
          <span className="text-[11px] font-mono leading-none">{formatDuration(duration)}</span>
        </div>
      ) : showLoader ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}
