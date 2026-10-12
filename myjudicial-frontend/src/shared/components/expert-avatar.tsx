"use client";

import { useState, useCallback } from "react";

function getInitials(name: string): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type ExpertAvatarProps = {
  src: string | null | undefined;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  shape?: "circle" | "squircle";
  className?: string;
};

const sizeClasses: Record<string, string> = {
  xs: "h-8 w-8 text-[10px]",
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-16 w-16 text-xl",
  "2xl": "h-20 w-20 text-2xl",
  "3xl": "h-24 w-24 text-3xl",
};

/**
 * Industrial avatar component for experts and users.
 *
 * - Renders the photo when `src` is a valid URL.
 * - Falls back to initials circle when `src` is null/empty.
 * - Falls back to initials circle if the image fails to load (onError).
 * - Supports circular and squircle (rounded-2xl) shapes.
 * - Zero external dependencies. No broken images.
 */
export function ExpertAvatar({ src, name, size = "md", shape = "circle", className = "" }: ExpertAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const showImage = src && !imgError;

  const handleError = useCallback(() => setImgError(true), []);
  const shapeClass = shape === "squircle" ? "rounded-2xl" : "rounded-full";

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${shapeClass} bg-brand-dark text-white dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-white/15 font-bold select-none ${sizeClasses[size] ?? sizeClasses.md} ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className={`h-full w-full ${shapeClass} object-cover`}
          loading="lazy"
          onError={handleError}
        />
      ) : (
        <span aria-hidden="true" className="tracking-tight">{initials}</span>
      )}
    </div>
  );
}

export const UserAvatar = ExpertAvatar;
