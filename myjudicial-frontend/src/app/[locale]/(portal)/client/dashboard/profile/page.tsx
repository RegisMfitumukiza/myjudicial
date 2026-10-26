import { requireAuth } from "@/server/auth/guards";
import { Mail, Phone, Shield, Calendar, BadgeCheck, Pencil } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ProfilePhotoCard } from "@/shared/components/photo-upload";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExtendedUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: string;
  status: string;
  emailVerifiedAt: Date | null;
  avatarObjectKey?: string | null;
  createdAt?: string | null;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "clientDashboard.profile" });
  const session = await requireAuth(locale);
  const user = session.user as unknown as ExtendedUser;

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
    <div className="mx-auto max-w-[1280px] space-y-6 p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <div>
        <h1 className="text-xl sm:text-[22px] font-bold text-gray-900 dark:text-gray-100 break-words">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Profile Card */}
        <div className="rounded-2xl border border-brand-border/20 dark:border-white/10 bg-white dark:bg-black p-5 sm:p-6 shadow-sm">
          <div>
            <ProfilePhotoCard
              currentImageUrl={user.avatarObjectKey ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.avatarObjectKey}` : null}
              initials={initials}
              userName={user.fullName}
              userEmail={user.email ?? ""}
              roleLabel={roleLabel}
              roleColor={roleColor}
            />

            <div className="mt-6 space-y-4 border-t border-brand-border/10 dark:border-white/10 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-dark/5 dark:bg-white/10">
                  <Mail size={15} className="text-brand-dark dark:text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("labels.email")}</p>
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{user.email ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-dark/5 dark:bg-white/10">
                  <Phone size={15} className="text-brand-dark dark:text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("labels.phone")}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.phone ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-dark/5 dark:bg-white/10">
                  <BadgeCheck size={15} className="text-brand-dark dark:text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("labels.status")}</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {user.status?.charAt(0)}{user.status?.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>

              {user.createdAt && (
                <div className="pt-2 border-t border-brand-border/10 dark:border-white/10 text-xs text-brand-dark/50 dark:text-white/50 text-center">
                  {t("memberSince", {
                    date: new Date(user.createdAt).toLocaleDateString(locale, {
                      month: "short",
                      year: "numeric",
                    }),
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details & Security Overview */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-border/20 dark:border-white/10 bg-white dark:bg-black shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t("personalInfo.title")}</h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t("personalInfo.subtitle")}</p>
              </div>
              <Link
                href="/client/dashboard/profile/edit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark/90 dark:bg-white dark:text-black"
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
                    <Shield size={13} className="text-brand-dark dark:text-white" />
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
                      {new Date(user.emailVerifiedAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border/20 dark:border-white/10 bg-white dark:bg-black shadow-sm">
            <div className="border-b border-brand-border/10 dark:border-white/10 px-5 py-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t("security.title")}</h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t("security.subtitle")}</p>
            </div>
            <div className="p-5">
              <div className="divide-y divide-brand-border/15 dark:divide-white/10 rounded-xl border border-brand-border/20 dark:border-white/10">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("security.emailVerification")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("security.emailVerifiedDesc")}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {t("security.active")}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("security.emailOtp")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("security.emailOtpDesc")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {t("security.active")}
                    </span>
                    <Link
                      href="/client/dashboard/security"
                      className="text-xs font-bold text-brand-dark dark:text-white hover:underline"
                    >
                      {t("manageDevices")}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("activeDevicesTitle")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("activeDevicesDesc")}</p>
                  </div>
                  <Link
                    href="/client/dashboard/security"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark dark:text-white hover:underline"
                  >
                    <span>{t("manageDevices")}</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
