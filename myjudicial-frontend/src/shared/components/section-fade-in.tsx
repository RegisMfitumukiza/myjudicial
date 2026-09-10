"use client";

import { type ReactNode, useEffect, useState } from "react";

type Props = {
  show: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Fade-in wrapper for section content. Use when transitioning from skeleton
 * to real content. The section fades in once `show` becomes true.
 */
export function SectionFadeIn({ show, children, className }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (show) {
      // Small delay to trigger CSS transition
      const raf = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(raf);
    }
    setMounted(false);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`transition-opacity duration-300 ease-out ${
        mounted ? "opacity-100" : "opacity-0"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
