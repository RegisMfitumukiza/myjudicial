"use client";

import { useTheme } from "@/shared/components/theme-provider";
import { Sun, Moon } from "lucide-react";
import * as React from "react";

interface ThemeToggleProps {
  variant?: "header" | "default";
  className?: string;
}

export function ThemeToggle({ variant = "default", className = "" }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const isDark = mounted && resolvedTheme
      ? resolvedTheme === "dark"
      : typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  };

  if (variant === "header") {
    return (
      <button
        onClick={toggleTheme}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full text-black dark:text-white transition-colors hover:bg-accent/20 ${className}`}
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        <Sun size={17} className="rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
        <Moon size={17} className="absolute rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <Sun size={16} className="rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
      <Moon size={16} className="absolute rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
