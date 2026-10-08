"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSession } from "next-auth/react";
import { toast } from "sonner";
import { supabaseClient, getRealtimeStatus } from "@/lib/socket";
import { refreshAccessToken } from "@/lib/api/client";
import { getGetNotificationsUnreadCountQueryKey } from "@/api/generated";

const TOKEN_REFRESH_INTERVAL_MS = 45 * 60 * 1000;

export interface RealtimeNotificationPayload {
  id?: string;
  subject?: string;
  body?: string;
  event?: string;
}

/**
 * Subscribes to the user's private notification channel for real-time delivery.
 * Automatically invalidates unread count and notification list queries upon arrival,
 * and presents an immediate user-facing toast alert.
 */
export function useNotificationsRealtime(userId?: string | null) {
  const queryClient = useQueryClient();

  // Keep Supabase Realtime auth token synchronized
  useEffect(() => {
    const status = getRealtimeStatus();
    if (!status.configured) return;

    let cancelled = false;

    async function syncAuth() {
      const session = await getSession();
      const token = (session as { accessToken?: string } | null)?.accessToken;
      if (!cancelled && token) {
        supabaseClient.realtime.setAuth(token);
      }
    }

    async function proactiveRefresh() {
      const token = await refreshAccessToken();
      if (!cancelled && token) {
        supabaseClient.realtime.setAuth(token);
      }
    }

    syncAuth();
    const interval = setInterval(proactiveRefresh, TOKEN_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Subscribe to user notification channel
  useEffect(() => {
    if (!userId) return;

    const status = getRealtimeStatus();
    if (!status.configured) return;

    const topic = `notifications:user-${userId}`;
    const realtimeTopic = `realtime:${topic}`;

    // If an existing channel is already subscribed and active, reuse it to avoid
    // "cannot add postgres_changes callbacks after subscribe()"
    const channels = ((supabaseClient as any).getChannels?.() ?? []) as Array<{ topic: string; state: string }>;
    const existing = channels.find(
      (c) => c.topic === topic || c.topic === realtimeTopic
    );

    if (existing) {
      if (existing.state === "joined" || existing.state === "joining") {
        return;
      }
      try {
        supabaseClient.removeChannel(existing as any);
      } catch {}
    }

    try {
      const channel = supabaseClient.channel(topic);

      channel
        .on(
          "broadcast",
          { event: "new_notification" },
          ({ payload }: { payload?: RealtimeNotificationPayload }) => {
            // Immediately invalidate unread count cache
            queryClient.invalidateQueries({
              queryKey: getGetNotificationsUnreadCountQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: ["notifications-unread"],
            });
            // Invalidate personal notification lists
            queryClient.invalidateQueries({
              queryKey: ["my-notifications"],
            });
            queryClient.invalidateQueries({
              queryKey: ["notifications"],
            });

            // Show immediate feedback
            if (payload?.subject) {
              toast.info(payload.subject, {
                description: payload.body,
              });
            }
          }
        )
        .on(
          "postgres_changes" as any,
          {
            event: "INSERT",
            schema: "public",
            table: "notification_logs",
            filter: `user_id=eq.${userId}`,
          } as any,
          (payload: any) => {
            queryClient.invalidateQueries({
              queryKey: getGetNotificationsUnreadCountQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: ["notifications-unread"],
            });
            queryClient.invalidateQueries({
              queryKey: ["my-notifications"],
            });
            queryClient.invalidateQueries({
              queryKey: ["notifications"],
            });

            const record = payload?.new;
            if (record?.subject) {
              toast.info(record.subject, {
                description: record.body,
              });
            }
          }
        )
        .subscribe();

      return () => {
        try {
          supabaseClient.removeChannel(channel);
        } catch {}
      };
    } catch (err) {
      console.warn("[realtime:notifications] Failed to subscribe to channel:", err);
    }
  }, [userId, queryClient]);
}
