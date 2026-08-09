"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSession } from "next-auth/react";
import { supabaseClient } from "@/lib/socket";
import { refreshAccessToken } from "@/lib/api/client";
import {
  getGetChatConversationsConversationIdMessagesQueryKey,
  getGetChatConversationsQueryKey,
  getGetChatConversationsUnreadCountQueryKey,
} from "@/api/generated";

const PAGE_SIZE = 30;
const TOKEN_REFRESH_INTERVAL_MS = 45 * 60 * 1000;

export type ChatTypingPayload = { userId: string; isTyping: boolean };

/**
 * Subscribes to a conversation's private Supabase Realtime channel for
 * instant message/typing push, replacing the need to poll every few seconds.
 * Access is enforced server-side by an RLS policy on the channel (see
 * backend/prisma/migrations/manual_enable_chat_realtime_rls.sql) -- this hook
 * only needs to keep the connection authenticated with a real, fresh
 * Supabase access token.
 *
 * NextAuth's session.accessToken is set once at sign-in and never refreshed
 * for the life of the session cookie, so this can't just react to session
 * changes -- it proactively refreshes on its own timer instead.
 */
export function useChatRealtime(
  conversationId: string | null,
  onTyping: (payload: ChatTypingPayload) => void
) {
  const queryClient = useQueryClient();
  const onTypingRef = useRef(onTyping);
  useEffect(() => {
    onTypingRef.current = onTyping;
  });

  useEffect(() => {
    let cancelled = false;

    // On mount, authenticate with whatever access token is already valid —
    // the same one every other API call uses — instead of forcing a
    // Supabase refresh-token redemption. Refresh tokens are single-use, so
    // redeeming one on every mount (including remounts from revisiting this
    // page) burns tokens that may already have been rotated elsewhere,
    // causing the next redemption to 401.
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

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabaseClient.channel(`conversation:${conversationId}`, {
      config: { private: true },
    });

    channel
      .on("broadcast", { event: "new_message" }, () => {
        queryClient.invalidateQueries({
          queryKey: getGetChatConversationsConversationIdMessagesQueryKey(conversationId, { limit: PAGE_SIZE }),
        });
        queryClient.invalidateQueries({ queryKey: getGetChatConversationsQueryKey({ limit: 50 }) });
        queryClient.invalidateQueries({ queryKey: getGetChatConversationsUnreadCountQueryKey() });
      })
      .on("broadcast", { event: "message_edited" }, () => {
        queryClient.invalidateQueries({
          queryKey: getGetChatConversationsConversationIdMessagesQueryKey(conversationId, { limit: PAGE_SIZE }),
        });
      })
      .on("broadcast", { event: "message_deleted" }, () => {
        queryClient.invalidateQueries({
          queryKey: getGetChatConversationsConversationIdMessagesQueryKey(conversationId, { limit: PAGE_SIZE }),
        });
      })
      .on<ChatTypingPayload>("broadcast", { event: "typing" }, ({ payload }) => {
        onTypingRef.current(payload);
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
}
