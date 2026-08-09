import { createClient } from "@supabase/supabase-js";

// Realtime provider: Supabase Realtime. Channels are created per-conversation
// inside the feature modules that need them (see
// src/features/chat/hooks/use-chat-realtime.ts); this module only owns the one
// shared client instance.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required environment variables"
  );
}

/**
 * Browser-side Supabase client (anon key). Realtime channel access is gated
 * by RLS policies on private channels — see
 * backend/prisma/migrations/manual_enable_chat_realtime_rls.sql. Callers
 * must keep the Realtime connection authenticated with a real Supabase
 * access token via `supabaseClient.realtime.setAuth(token)` — see
 * use-chat-realtime.ts for how that token is kept fresh.
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export function getRealtimeStatus() {
  return {
    provider: "supabase",
    configured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}
