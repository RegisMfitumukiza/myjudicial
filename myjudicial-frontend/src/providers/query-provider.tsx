"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient } from "@tanstack/react-query";

function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  // 4xx client errors (404 not found, 400 validation, 401/403 auth, etc.) are
  // deterministic — retrying won't change the outcome, it just delays the UI.
  if (typeof status === "number" && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 1;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// Singleton for server - avoids creating a new client on every server render
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return makeQueryClient();
  }
  // Browser: reuse the same client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures the client isn't recreated on re-renders
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
