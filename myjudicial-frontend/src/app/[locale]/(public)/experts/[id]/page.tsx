import { redirect } from "next/navigation";

export default async function ExpertProfileRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/lawyers/${id}`);
}
