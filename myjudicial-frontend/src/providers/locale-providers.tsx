"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/providers/auth-provider";

export function LocaleProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}