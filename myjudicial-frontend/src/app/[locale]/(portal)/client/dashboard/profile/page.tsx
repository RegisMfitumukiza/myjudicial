import { requireAuth } from "@/server/auth/guards";
import { Mail, Phone, Shield, Calendar, BadgeCheck, Pencil } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ProfilePhotoCard } from "@/shared/components/photo-upload";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const t = await getTranslations("clientDashboard.profile");
  const session = await requireAuth();
  const { user } = session;

  const initials = user.fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = user.role === "ADMIN" ? t("roles.admin")
    : user.role === "EXPERT" ? t("roles.expert")
    : t("roles.client");

  const roleColor = user.role === "ADMIN" ? "bg-brand-alert/10 text-brand-alert"
    : user.role === "EXPERT" ? "bg-brand-dark/10 text-brand-dark"
    : "bg-brand-dark/10 text-brand-dark";

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Profile Card */}
        <div className="rounded-xl border border-brand-border/20 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="p-6">
            <ProfilePhotoCard
              currentImageUrl={(user as any).avatarObjectKey ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${(user as any).avatarObjectKey}` : null}
              initials={initials}
              userName={user.fullName}
              userEmail={user.email ?? ""}
              roleLabel={roleLabel}
              roleColor={roleColor}
            />

            <div className="mt-6 space-y-4 border-t border-brand-border/10 dark:border-gray-700 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Mail size={15} className="text-brand-blue" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("labels.email")}</p>
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{user.email ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Phone size={15} className="text-brand-blue" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("labels.phone")}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.phone ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <BadgeCheck size={15} className="text-brand-blue" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("labels.status")}</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-dark/10 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-brand-dark dark:text-white">
                    <span className={`h-1.5 w-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-green-500" : user.status === "PENDING" ? "bg-yellow-500" : "bg-red-500"}`} />
                    {user.status?.charAt(0)}{user.status?.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="rounded-xl border border-brand-border/20 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-gray-700 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t("personalInfo.title")}</h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t("personalInfo.subtitle")}</p>
              </div>
              <Link
                href="/client/dashboard/profile/edit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark/90"
              >
                <Pencil size={14} />
                {t("personalInfo.editProfile")}
              </Link>
            </div>
            <div className="p-5">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("personalInfo.fullName")}</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.fullName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("personalInfo.role")}</label>
                  <div className="flex items-center gap-1.5">
                    <Shield size={13} className="text-brand-blue" />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{roleLabel}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("personalInfo.emailAddress")}</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("personalInfo.phoneNumber")}</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.phone ?? "—"}</p>
                </div>
                {user.emailVerifiedAt && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("personalInfo.emailVerified")}</label>
                    <p className="text-sm font-medium text-brand-dark dark:text-white">
                      <Calendar size={13} className="mr-1 inline" />
                      {new Date(user.emailVerifiedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-brand-border/20 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="border-b border-brand-border/10 dark:border-gray-700 px-5 py-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t("security.title")}</h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t("security.subtitle")}</p>
            </div>
            <div className="p-5">
              <div className="divide-y divide-brand-border dark:divide-gray-700 rounded-lg border border-brand-border/20 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("security.emailVerification")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("security.emailVerifiedDesc")}</p>
                  </div>
                    <span className="rounded-full bg-brand-dark/10 dark:bg-white/10 px-2.5 py-0.5 text-xs font-bold text-brand-dark dark:text-white">{t("security.active")}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("security.twoFactor")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("security.twoFactorDesc")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{t("security.disabled")}</span>
                    <button className="text-sm font-semibold text-brand-dark hover:underline">{t("security.enable")}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}