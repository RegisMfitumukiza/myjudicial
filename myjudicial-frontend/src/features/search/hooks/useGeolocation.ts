"use client";

import { useState, useCallback } from "react";

type GeolocationState = {
  lat: number;
  lng: number;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permission: "granted" | "denied" | "prompt" | null;
};

const KIGALI_CENTER = { lat: -1.9441, lng: 30.0619 };

export function useGeolocation(initialCoords?: { lat: number; lng: number }) {
  const [state, setState] = useState<GeolocationState>({
    lat: initialCoords?.lat ?? KIGALI_CENTER.lat,
    lng: initialCoords?.lng ?? KIGALI_CENTER.lng,
    accuracy: null,
    loading: false,
    error: null,
    permission: initialCoords ? "granted" : null,
  });

  const requestLocation = useCallback((onSuccess?: (lat: number, lng: number) => void) => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported" }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setState({
          lat,
          lng,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permission: "granted",
        });
        onSuccess?.(lat, lng);
      },
      (err) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: err.message,
          permission: err.code === err.PERMISSION_DENIED ? "denied" : s.permission,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const resetToDefault = useCallback(() => {
    setState({
      lat: KIGALI_CENTER.lat,
      lng: KIGALI_CENTER.lng,
      accuracy: null,
      loading: false,
      error: null,
      permission: null,
    });
  }, []);

  return { ...state, requestLocation, resetToDefault };
}
