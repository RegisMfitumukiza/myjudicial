"use client";

import { useState, useCallback } from "react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type ExpertAvatarProps = {
  src: string | null | undefined;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "squircle";
  className?: string;
};

const sizeClasses: Record<string, string> = {
  xs: "h-8 w-8 text-[10px]",
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-16 w-16 text-xl",
};

/**
 * Industrial avatar component for experts.
 *
 * - Renders the photo when `src` is a valid URL.
 * - Falls back to initials circle when `src` is null/empty.
 * - Falls back to initials circle if the image fails to load (onError).
 * - Supports circular and squircle (rounded-2xl) shapes.
 * - Zero external dependencies. No pravatar.cc. No broken images.
 */
export function ExpertAvatar({ src, name, size = "md", shape = "circle", className = "" }: ExpertAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const showImage = src && !imgError;

  const handleError = useCallback(() => setImgError(true), []);
  const shapeClass = shape === "squircle" ? "rounded-2xl" : "rounded-full";

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${shapeClass} bg-brand-dark text-white dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-white/15 font-bold ${sizeClasses[size]} ${className}`}
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
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}
