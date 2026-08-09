"use client";

import { Link } from "@/i18n/routing";
import { Star, Quote, ArrowRight } from "lucide-react";
import { useFeaturedReviews, FeaturedReview } from "@/lib/api/landing";
import { useTranslations } from "next-intl";

function humanizeSpecialty(s: string): string {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function ReviewCard({ review }: { review: FeaturedReview }) {
  const t = useTranslations("public");
  const initials = review.clientName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      {/* Rating */}
      <div className="mb-3 flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < review.rating ? "fill-brand-dark text-brand-dark" : "text-border"}
          />
        ))}
      </div>

      {/* Quote */}
      {review.comment && (
        <div className="relative mb-4 flex-1">
          <Quote size={20} className="absolute -left-1 -top-1 text-brand-dark/10" />
          <p className="text-sm leading-6 text-foreground/80 pl-4">
            {review.comment.length > 180 ? review.comment.slice(0, 180) + "..." : review.comment}
          </p>
        </div>
      )}

      {/* Expert info */}
      <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2">
        <p className="text-[11px] text-muted-foreground">{t("testimonials.consultationWith")}</p>
        <Link href={`/lawyers/${review.expertId}`} className="text-xs font-bold text-foreground hover:text-brand-dark transition-colors">
          {review.expertName}
        </Link>
        {review.expertSpecialty && (
          <p className="text-[10px] text-muted-foreground">{humanizeSpecialty(review.expertSpecialty)}</p>
        )}
      </div>

      {/* Client */}
      <div className="flex items-center gap-2.5 border-t border-border/50 pt-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-on-brand">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{review.clientName}</p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const t = useTranslations("public");
  const { data: reviews, isLoading } = useFeaturedReviews(6);

  if (isLoading) {
    return (
      <section className="bg-background py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-dark">{t("testimonials.badge")}</p>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("testimonials.title")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="bg-background py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-dark">{t("testimonials.badge")}</p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("testimonials.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("testimonials.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => document.getElementById("expert-list")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark transition hover:text-brand-dark/80"
          >
            {t("testimonials.browseLawyers")} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
