"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from "next-themes";

function ThemeCookieSynchronizer() {
  const { theme, setTheme } = useTheme();
  const initializedRef = React.useRef(false);
  const lastSavedThemeRef = React.useRef<string | null>(null);

  // 1. Initial synchronization on mount ONLY (never on subsequent theme toggles)
  React.useEffect(() => {
    if (typeof window === "undefined" || initializedRef.current) return;
    initializedRef.current = true;

    // A. Check URL search param (e.g. ?theme=light)
    const urlParams = new URLSearchParams(window.location.search);
    const urlTheme = urlParams.get("theme");
    if (urlTheme && ["light", "dark", "system"].includes(urlTheme)) {
      lastSavedThemeRef.current = urlTheme;
      setTheme(urlTheme);
      try {
        localStorage.setItem("theme", urlTheme);
      } catch {}

      // Clean the theme parameter from the URL bar so it doesn't linger or re-apply
      urlParams.delete("theme");
      const newSearch = urlParams.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState(null, "", newUrl);
      return;
    }

    // B. Check shared cookie across subdomains (.myjudicial.com) on cold initial mount
    const match = document.cookie.match(/(?:^|;\s*)mj_theme=([^;]+)/);
    const cookieTheme = match ? decodeURIComponent(match[1]) : null;

    // The shared cookie is the authoritative source of truth across subdomains
    if (cookieTheme && ["light", "dark", "system"].includes(cookieTheme)) {
      lastSavedThemeRef.current = cookieTheme;
      setTheme(cookieTheme);
      try {
        localStorage.setItem("theme", cookieTheme);
      } catch {}
    } else {
      const localTheme = localStorage.getItem("theme");
      if (localTheme && ["light", "dark", "system"].includes(localTheme)) {
        lastSavedThemeRef.current = localTheme;
      }
    }
  }, [setTheme]);

  // 2. Whenever theme changes, broadcast to shared cookie across .myjudicial.com
  React.useEffect(() => {
    if (typeof window === "undefined" || !theme || !initializedRef.current) return;
    // Prevent re-broadcasting if this matches what was already loaded or saved
    if (lastSavedThemeRef.current === theme) return;
    lastSavedThemeRef.current = theme;

    const hostname = window.location.hostname.toLowerCase();
    const domainSuffix = hostname.includes("myjudicial.com") ? "; domain=.myjudicial.com" : "";
    const secureSuffix = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `mj_theme=${encodeURIComponent(theme)}${domainSuffix}; path=/; max-age=31536000; SameSite=Lax${secureSuffix}`;
  }, [theme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      <ThemeCookieSynchronizer />
      {children}
    </NextThemesProvider>
  );
}

export { useTheme } from "next-themes";