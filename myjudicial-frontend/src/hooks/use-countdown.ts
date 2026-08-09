"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((seconds?: number) => {
    clear();
    setRemaining(seconds ?? initialSeconds);
    setIsActive(true);
  }, [clear, initialSeconds]);

  const stop = useCallback(() => {
    clear();
    setIsActive(false);
  }, [clear]);

  const reset = useCallback(() => {
    clear();
    setRemaining(initialSeconds);
    setIsActive(false);
  }, [clear, initialSeconds]);

  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clear();
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clear;
  }, [isActive, clear]);

  useEffect(() => clear, [clear]);

  return { remaining, isActive, start, stop, reset };
}
