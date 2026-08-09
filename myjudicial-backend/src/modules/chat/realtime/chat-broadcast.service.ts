import { supabaseAdmin } from "../../../infrastructure/supabase/supabase.client.js";
import { logger } from "../../../shared/utils/logger.js";

/**
 * Pushes an event to every client subscribed to a conversation's private
 * Supabase Realtime channel. Callers must have already verified conversation
 * access themselves — this only delivers to whoever the Realtime Authorization
 * RLS policy (see prisma/migrations/manual_enable_chat_realtime_rls.sql)
 * allows to receive it, but this call itself does not re-check anything.
 *
 * Always call fire-and-forget with a .catch() — a broadcast failure must
 * never fail the underlying REST request that triggered it.
 */
export const ChatBroadcastService = {
  broadcastToConversation: async (
    conversationId: string,
    event: "new_message" | "message_edited" | "message_deleted" | "typing",
    payload: unknown
  ): Promise<void> => {
    // httpSend hits the Realtime REST broadcast endpoint directly — no
    // WebSocket subscription needed, which matters here since this runs
    // once per HTTP request on a stateless Express server.
    const channel = supabaseAdmin.channel(`conversation:${conversationId}`, {
      config: { private: true },
    });
    try {
      const result = await channel.httpSend(event, payload);
      if (!result.success) {
        logger.error("Chat broadcast failed", { conversationId, event, status: result.status, error: result.error });
      }
    } finally {
      await supabaseAdmin.removeChannel(channel);
    }
  },
};
