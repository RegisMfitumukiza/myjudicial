"use client";

import { useSessionExpiry } from "@/hooks/use-session-expiry";

export function SessionWatcher() {
  useSessionExpiry();
  return null;
}
