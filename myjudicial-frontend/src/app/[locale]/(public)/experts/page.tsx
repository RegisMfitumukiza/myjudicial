import { redirect } from "next/navigation";

export default function ExpertsPage() {
  // Legacy route — redirect to lawyer discovery search page
  redirect("/search");
}
