import type { Metadata } from "next";
import LandingPage from "./landing-client";

export const metadata: Metadata = {
  title: "MyJudicial | Find Verified Legal Experts in Rwanda",
  description:
    "Browse verified lawyers, compare fixed fees, and book legal consultations in minutes. Rwanda's trusted legal marketplace.",
  openGraph: {
    title: "MyJudicial | Find Verified Legal Experts",
    description: "Browse verified lawyers, compare fixed fees, and book instantly.",
    url: "https://myjudicial.rw",
    siteName: "MyJudicial",
    images: [{ url: "/og-image.png" }],
    locale: "en_US",
    type: "website",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
