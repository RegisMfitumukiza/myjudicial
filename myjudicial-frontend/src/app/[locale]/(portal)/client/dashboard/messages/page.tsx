"use client";

import { Suspense } from "react";
import { MessagesPanel } from "@/features/chat/components/messages-panel";
import { useTranslations } from "next-intl";

export default function MessagesPage() {
  const t = useTranslations("clientDashboard");
  return (
    <Suspense>
      <MessagesPanel subtitle={t("messagesSubtitle")} />
    </Suspense>
  );
}
