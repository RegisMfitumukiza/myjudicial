"use client";

import { Star } from "lucide-react";

type StarRatingProps = {
  rating: number | null | undefined;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  showNewBadge?: boolean;
  className?: string;
};

const STAR_SIZES = {
  sm: 10,
  md: 14,
  lg: 18,
};

const TEXT_SIZES = {
  sm: "text-[11px]",
  md: "text-[13px]",
  lg: "text-sm",
};

/**
 * Production-quality star rating display component.
 * Consistent across the entire application.
 *
 * - rating: 0-5 or null/undefined for no reviews
 * - reviewCount: optional count to display next to rating
 * - size: sm (cards), md (lists), lg (profiles)
 * - showCount: whether to show "(128)" review count
 * - showNewBadge: show "New" badge when no reviews
 */
export function StarRating({
  rating,
  reviewCount,
  size = "sm",
  showCount = true,
  showNewBadge = true,
  className = "",
}: StarRatingProps) {
  const starSize = STAR_SIZES[size];
  const textSize = TEXT_SIZES[size];
  const hasRating = rating != null && rating > 0;
  const displayRating = hasRating ? Number(rating).toFixed(1) : null;
  const count = reviewCount ?? 0;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {hasRating ? (
        <>
          <Star
            size={starSize}
            className="fill-brand-dark text-brand-dark dark:fill-white dark:text-white"
          />
          <span className={`${textSize} font-bold text-foreground`}>
            {displayRating}
          </span>
          {showCount && count > 0 && (
            <span className={`${textSize} text-muted-foreground font-normal`}>
              ({count})
            </span>
          )}
        </>
      ) : showNewBadge ? (
        <span
          className={`${textSize} rounded-full bg-accent px-2 py-0.5 font-medium text-muted-foreground`}
        >
          New
        </span>
      ) : null}
    </div>
  );
}
