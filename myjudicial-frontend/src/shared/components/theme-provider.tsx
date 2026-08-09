"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  themes: string[];
  systemTheme: "dark" | "light" | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("theme") as Theme | null;
  return stored ?? "system";
}

function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = getResolvedTheme(theme);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  localStorage.setItem("theme", theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    getResolvedTheme(getInitialTheme())
  );
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() => getSystemTheme());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const newSystemTheme = mediaQuery.matches ? "dark" : "light";
      setSystemTheme(newSystemTheme);
      if (theme === "system") {
        setResolvedTheme(newSystemTheme);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newSystemTheme);
        document.documentElement.style.colorScheme = newSystemTheme;
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
        setResolvedTheme(getResolvedTheme(newTheme));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setResolvedTheme(getResolvedTheme(newTheme));
  };

  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: "system",
          setTheme: () => {},
          resolvedTheme: "light",
          themes: ["light", "dark", "system"],
          systemTheme: "light",
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, themes: ["light", "dark", "system"], systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}