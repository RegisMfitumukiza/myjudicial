"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  /** true = logo sits on a DARK background. false = on a LIGHT background. */
  light?: boolean;
  iconSize?: number;
  fontSize?: string;
  href?: string;
  onClick?: () => void;
  hideTextOnSmall?: boolean;
}

const LOGO_WIDTH = 491;
const LOGO_HEIGHT = 351;

export function Logo({
  className = "",
  iconOnly = false,
  light = false,
  iconSize = 24,
  fontSize = "text-[14px]",
  href = "/",
  onClick,
  hideTextOnSmall = false,
}: LogoProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none group transition-opacity hover:opacity-90 ${className}`}
    >
      <Image
        src="/myjudicial-logo.png"
        alt="MyJudicial"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        style={{ width: "auto", height: `${iconSize}px` }}
        className={`shrink-0 object-contain transition-transform group-hover:scale-105 ${
          light ? "brightness-0 invert" : ""
        }`}
        priority
      />

      {!iconOnly && (
        <span
          className={`font-bold tracking-tight whitespace-nowrap shrink-0 ${
            hideTextOnSmall ? "hidden min-[400px]:inline" : ""
          } ${fontSize} ${
            light ? "text-white" : "text-foreground"
          }`}
        >
          Myjudicial
        </span>
      )}
    </Link>
  );
}
