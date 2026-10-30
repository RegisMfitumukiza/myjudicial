"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { usePlatformSettings } from "@/features/settings/hooks/useSocialLinks";

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
  const { settings } = usePlatformSettings();
  const logoSrc = settings?.brandLogoUrl?.trim() || "/myjudicial-logo.png";
  const platformName = settings?.platformName?.trim() || "MyJudicial";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none group transition-opacity hover:opacity-90 ${className}`}
    >
      <Image
        src={logoSrc}
        alt={platformName}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        unoptimized
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
          {platformName}
        </span>
      )}
    </Link>
  );
}
