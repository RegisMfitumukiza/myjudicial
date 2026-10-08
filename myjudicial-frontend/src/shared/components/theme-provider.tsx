"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from "next-themes";

function ThemeCookieSynchronizer() {
  const { theme, setTheme } = useTheme();

  // 1. On mount, check if URL parameter or cross-subdomain cookie has a theme preference
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // A. Check URL search param (e.g. ?theme=light)
    const urlParams = new URLSearchParams(window.location.search);
    const urlTheme = urlParams.get("theme");
    if (urlTheme && ["light", "dark", "system"].includes(urlTheme)) {
      setTheme(urlTheme);
      try {
        localStorage.setItem("theme", urlTheme);
      } catch {}
      return;
    }

    // B. Check shared cookie across subdomains (.myjudicial.com)
    const match = document.cookie.match(/(?:^|;\s*)mj_theme=([^;]+)/);
    const cookieTheme = match ? decodeURIComponent(match[1]) : null;
    const localTheme = localStorage.getItem("theme");

    if (cookieTheme && ["light", "dark", "system"].includes(cookieTheme) && cookieTheme !== localTheme) {
      setTheme(cookieTheme);
      try {
        localStorage.setItem("theme", cookieTheme);
      } catch {}
    }
  }, [setTheme]);

  // 2. Whenever theme changes, broadcast to shared cookie across .myjudicial.com
  React.useEffect(() => {
    if (typeof window === "undefined" || !theme) return;
    const hostname = window.location.hostname.toLowerCase();
    const domainSuffix = hostname.includes("myjudicial.com") ? "; domain=.myjudicial.com" : "";
    document.cookie = `mj_theme=${encodeURIComponent(theme)}${domainSuffix}; path=/; max-age=31536000; SameSite=Lax`;
  }, [theme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeCookieSynchronizer />
      {children}
    </NextThemesProvider>
  );
}

export { useTheme } from "next-themes";