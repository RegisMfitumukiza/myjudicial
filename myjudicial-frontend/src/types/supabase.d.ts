declare module "@supabase/supabase-js" {
  interface RealtimeChannel {
    on<T = Record<string, unknown>>(
      type: string,
      filter: { event: string },
      callback: (payload: { payload: T }) => void
    ): RealtimeChannel;
    subscribe(): RealtimeChannel;
  }

  interface RealtimeClient {
    setAuth(token: string): void;
  }

  interface SupabaseClient {
    channel(name: string, opts?: Record<string, unknown>): RealtimeChannel;
    removeChannel(channel: RealtimeChannel): void;
    realtime: RealtimeClient;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>
  ): SupabaseClient;
}
