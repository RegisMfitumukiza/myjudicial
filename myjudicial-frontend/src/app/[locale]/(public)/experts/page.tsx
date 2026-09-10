import { redirect } from "next/navigation";

export default function ExpertsPage() {
  // Legacy route — redirect to landing page
  redirect("/");
}
