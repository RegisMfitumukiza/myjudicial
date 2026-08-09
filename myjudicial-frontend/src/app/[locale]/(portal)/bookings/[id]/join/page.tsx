import { auth } from "@/server/auth/authjs";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";

export default async function JoinMeetingRedirect({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const session = await auth();
  const locale = await getLocale();

  const user = session?.user;

  if (!user) {
    redirect(
      { href: { pathname: "/sign-in", query: { callbackUrl: `/bookings/${id}/join` } }, locale }
    );
  }

  const role = user!.role;

  if (role === "EXPERT" || role === "LAW_FIRM") {
    redirect(
      { href: `/expert/dashboard/consultations/${id}/join`, locale }
    );
  }

  if (role === "CITIZEN" || role === "BUSINESS") {
    redirect(
      { href: `/client/dashboard/consultations/${id}/join`, locale }
    );
  }

  redirect({ href: "/client/dashboard", locale });
}
