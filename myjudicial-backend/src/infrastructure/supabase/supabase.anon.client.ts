import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_ANON_KEY are required environment variables"
  );
}

/**
 * Server-side Supabase client using the anon key.
 * This client is used for non-authenticated authentication flows
 * such as sending OTPs, verifying OTPs, magic links, token refreshes, and admin logins.
 */
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  // Node.js 20 requires explicit ws transport — native WebSocket added in Node 22
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  realtime: { transport: ws as any },
});
