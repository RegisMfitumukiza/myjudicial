"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { calculateHaversineDistanceKm } from "../utils/geo";

export type DeviceLocationStatus =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "unavailable";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type DeviceLocationResult = {
  userLocation: Coordinates | null;
  accuracy: number | null;
  status: DeviceLocationStatus;
  requestLocation: (forceFresh?: boolean) => void;
  isWatching: boolean;
};

export function useDeviceLocation(): DeviceLocationResult {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<DeviceLocationStatus>("idle");
  const [isWatching, setIsWatching] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<Coordinates | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const nextCoords: Coordinates = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };

    // If we already have a location, only trigger update if moved > 25 meters
    // to prevent micro-jitter from causing continuous re-renders
    if (lastLocationRef.current) {
      const movedKm = calculateHaversineDistanceKm(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        nextCoords.lat,
        nextCoords.lng
      );
      if (movedKm < 0.025) {
        return; // less than 25m movement, keep current position
      }
    }

    lastLocationRef.current = nextCoords;
    setUserLocation(nextCoords);
    setAccuracy(pos.coords.accuracy);
    setStatus("granted");
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      setStatus("denied");
    } else {
      setStatus("unavailable");
    }
  }, []);

  const requestLocation = useCallback(
    (forceFresh = true) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        setStatus("unavailable");
        return;
      }

      setStatus("loading");

      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: forceFresh ? 0 : 5000,
        }
      );
    },
    [handleSuccess, handleError]
  );

  // Initialize and check permission on mount
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    // Try to query permission status if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          if (permissionStatus.state === "granted") {
            requestLocation(true);
          } else if (permissionStatus.state === "denied") {
            setStatus("denied");
          } else {
            // Prompt: trigger soft request on initial load
            requestLocation(false);
          }

          permissionStatus.onchange = () => {
            if (permissionStatus.state === "granted") {
              requestLocation(true);
            } else if (permissionStatus.state === "denied") {
              setStatus("denied");
              setUserLocation(null);
            }
          };
        })
        .catch(() => {
          requestLocation(false);
        });
    } else {
      requestLocation(false);
    }
  }, [requestLocation]);

  // Set up continuous watchPosition for live movement tracking
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    if (status === "granted") {
      setIsWatching(true);
      const id = navigator.geolocation.watchPosition(
        handleSuccess,
        (err) => {
          // Soft failure in background watch does not invalidate granted state
          if (err.code === err.PERMISSION_DENIED) {
            setStatus("denied");
            setUserLocation(null);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0, // always demand fresh GPS — no stale cache
        }
      );
      watchIdRef.current = id;
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsWatching(false);
      }
    };
  }, [status, handleSuccess]);

  return {
    userLocation,
    accuracy,
    status,
    requestLocation,
    isWatching,
  };
}
