import type { Metadata } from "next";
import FaqsClient from "./faqs-client";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | MyJudicial",
  description: "Find answers to common questions about using MyJudicial, booking lawyers, and making payments.",
};

export default function FaqsPage() {
  return <FaqsClient />;
}
