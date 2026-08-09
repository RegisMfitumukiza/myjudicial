"use client";

import { use, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { ArrowLeft, Loader2, AlertCircle, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { usePostBookingsBookingIdReview } from "@/api/generated";
import { useTranslations } from "next-intl";

export default function LeaveReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { booking, isLoading, error } = useBooking(id);
  const { mutate: submitReview, isPending } = usePostBookingsBookingIdReview();
  const t = useTranslations("clientDashboard_review");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark/50 dark:text-white/50" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-black px-6">
        <AlertCircle className="h-10 w-10 text-brand-alert mb-4" />
        <p className="text-brand-alert font-medium">{t("failedToLoadBooking")}</p>
        <Button asChild variant="outline" className="mt-4 border-brand-border/20 text-xs">
          <Link href="/client/dashboard/consultations">{t("backToMyBookings")}</Link>
        </Button>
      </div>
    );
  }

  if (booking.status !== "COMPLETED") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-black px-6 text-center">
        <AlertCircle className="h-10 w-10 text-brand-alert mb-4" />
        <p className="text-brand-dark dark:text-white font-medium">{t("consultationNotCompleted")}</p>
        <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50">{t("leaveReviewOnceComplete")}</p>
        <Button asChild variant="outline" className="mt-4 border-brand-border/20 text-xs">
          <Link href={`/client/dashboard/consultations/${id}`}>{t("backToConsultation")}</Link>
        </Button>
      </div>
    );
  }

  if (booking.review) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-black px-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-brand-green mb-4" />
        <p className="text-brand-dark dark:text-white font-medium">{t("alreadyReviewed")}</p>
        <div className="mt-3 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={18} className={i < booking.review!.rating ? "fill-amber-500 text-amber-500" : "text-brand-dark/20 dark:text-white/20"} />
          ))}
        </div>
        {booking.review.comment && (
          <p className="mt-3 max-w-md text-[13px] text-brand-dark/60 dark:text-white/60">{booking.review.comment}</p>
        )}
        <Button asChild variant="outline" className="mt-6 border-brand-border/20 text-xs">
          <Link href={`/client/dashboard/consultations/${id}`}>{t("backToConsultation")}</Link>
        </Button>
      </div>
    );
  }

  function handleSubmit() {
    if (rating < 1) {
      toast.error(t("selectStarRating"));
      return;
    }
    submitReview(
      { bookingId: id, data: { rating, comment: comment.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success(t("reviewSubmitted"));
          router.push(`/client/dashboard/consultations/${id}`);
        },
        onError: (err) => {
          toast.error(err.message || t("failedToSubmitReview"));
        },
      }
    );
  }

  return (
    <main className="flex h-full flex-col bg-white dark:bg-black overflow-y-auto">
      <div className="mx-auto w-full max-w-[600px] flex-1 px-6 py-8">
        <Link
          href={`/client/dashboard/consultations/${id}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white mb-6"
        >
          <ArrowLeft size={14} />
          {t("backToConsultation")}
        </Link>

        <h1 className="text-[22px] font-bold text-brand-dark dark:text-white">{t("leaveAReview")}</h1>
        <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50">
          {t("withExpert", {
            serviceName: booking.service?.name ?? t("consultation"),
            expertName: booking.expert?.displayName ?? t("legalExpert"),
          })}
        </p>

        <div className="mt-6 rounded-2xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-white/20 dark:bg-black">
          <label className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50">
            {t("yourRating")}
          </label>
          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              const filled = value <= (hoverRating || rating);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5"
                >
                  <Star size={32} className={filled ? "fill-amber-500 text-amber-500" : "text-brand-dark/20 dark:text-white/20"} />
                </button>
              );
            })}
          </div>

          <label className="mt-6 block text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50">
            {t("commentOptional")}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("shareDetailsPlaceholder")}
            rows={4}
            maxLength={2000}
            className="mt-3 w-full rounded-lg border border-brand-border/20 bg-white px-3 py-2.5 text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/30 focus:border-brand-dark dark:bg-black dark:text-white dark:border-white/20"
          />

          <Button
            className="mt-6 w-full rounded-xl bg-brand-dark py-3 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-black"
            disabled={isPending || rating < 1}
            onClick={handleSubmit}
          >
            {isPending ? t("submitting") : t("submitReview")}
          </Button>
        </div>
      </div>
    </main>
  );
}
