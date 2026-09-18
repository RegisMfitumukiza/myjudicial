"use client";

import { useTheme } from "@/shared/components/theme-provider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  variant?: "header" | "default";
  className?: string;
}

export function ThemeToggle({ variant = "default", className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  if (variant === "header") {
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground ${className}`}
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        <Sun size={17} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon size={17} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <Sun size={16} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon size={16} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
