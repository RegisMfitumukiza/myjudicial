"use client";

import { DocumentsPanel } from "@/features/documents/components/documents-panel";
import { useTranslations } from "next-intl";

export default function DocumentsPage() {
  const t = useTranslations("clientDashboard_documents");
  return <DocumentsPanel />;
}
