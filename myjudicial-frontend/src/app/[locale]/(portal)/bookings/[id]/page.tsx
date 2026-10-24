import { auth } from "@/server/auth/authjs";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";

export default async function BookingDetailsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const locale = await getLocale();

  const user = session?.user;

  if (!user) {
    redirect(
      { href: { pathname: "/sign-in", query: { callbackUrl: `/bookings/${id}` } }, locale }
    );
  }

  const role = user!.role;

  if (role === "EXPERT" || role === "LAW_FIRM") {
    redirect(
      { href: `/expert/dashboard/bookings/${id}`, locale }
    );
  }

  redirect(
    { href: `/client/dashboard/consultations/${id}`, locale }
  );
}
