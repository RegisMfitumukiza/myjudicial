import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required environment variables"
  );
}

/**
 * Server-side Supabase client using the service role key.
 * This client bypasses Row-Level Security — use only in trusted server code.
 * Never expose this key to the frontend.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  // Node.js 20 requires explicit ws transport — native WebSocket added in Node 22
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  realtime: { transport: ws as any },
});
