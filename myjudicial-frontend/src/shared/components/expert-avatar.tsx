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
 * - Zero external dependencies. No pravatar.cc. No broken images.
 */
export function ExpertAvatar({ src, name, size = "md", className = "" }: ExpertAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const showImage = src && !imgError;

  const handleError = useCallback(() => setImgError(true), []);

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-brand-dark font-bold text-on-brand ${sizeClasses[size]} ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover"
          loading="lazy"
          onError={handleError}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}
