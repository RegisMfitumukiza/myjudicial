import { MapPin, Briefcase, CheckCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { StarRating } from "@/shared/components/star-rating";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { getLocalizedSpecialty } from "@/shared/constants/specialties";

type ExpertInfoHeaderProps = {
  displayName: string;
  primarySpecialty: string | null;
  avatarUrl: string | null;
  verified: boolean;
  avgRating: number | null;
  totalBookings?: number | null;
  officeAddress: string | null;
  yearsExperience: number | null;
  showTimezone?: boolean;
};

export function ExpertInfoHeader({
  displayName,
  primarySpecialty,
  avatarUrl,
  verified,
  avgRating,
  totalBookings,
  officeAddress,
  yearsExperience,
  showTimezone = false,
}: ExpertInfoHeaderProps) {
  const t = useTranslations("search");
  const tSpecialties = useTranslations("specialties");
  return (
    <div>
      <div className="flex items-start gap-4">
        <ExpertAvatar src={avatarUrl} name={displayName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">{displayName}</h3>
              <p className="text-sm text-brand-dark/50 dark:text-white/50">
                {primarySpecialty ? getLocalizedSpecialty(primarySpecialty, tSpecialties) : t("legalExpert")}
              </p>
            </div>
            {avgRating != null && avgRating > 0 && (
              <span className="flex shrink-0 items-center rounded-full bg-brand-dark/10 px-2.5 py-1 dark:bg-white/10">
                <StarRating rating={avgRating} reviewCount={totalBookings ?? 0} size="sm" showNewBadge={false} />
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {verified && (
              <span className="inline-flex items-center gap-1 rounded-md bg-brand-dark/5 px-2 py-1 text-xs font-medium text-brand-dark dark:bg-white/10 dark:text-white">
                <CheckCircle size={12} /> {t("verified")}
              </span>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-brand-dark/50 dark:text-white/50">
            {officeAddress && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {officeAddress}
              </span>
            )}
            {yearsExperience != null && yearsExperience > 0 && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {t("yearsExp", { years: yearsExperience })}
              </span>
            )}
          </div>
        </div>
      </div>

      {showTimezone && (
        <div className="mt-4 rounded-lg bg-brand-dark/5 p-3 dark:bg-white/5">
          <p className="flex items-center gap-2 text-xs text-brand-dark/60 dark:text-white/60">
            <Clock className="h-4 w-4" />
            {t.rich("timezoneNote", { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </div>
      )}
    </div>
  );
}
