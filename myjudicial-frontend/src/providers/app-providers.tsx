"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";

import { QueryProvider } from "@/providers/query-provider";
import { SessionWatcher } from "@/providers/session-watcher";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <SessionWatcher />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
