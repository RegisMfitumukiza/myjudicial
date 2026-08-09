"use client";

import { Suspense } from "react";
import { MessagesPanel } from "@/features/chat/components/messages-panel";
import { useTranslations } from "next-intl";

function MessagesPageContent() {
  const t = useTranslations("expertDashboard");
  return <MessagesPanel subtitle={t("messagesDesc")} />;
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesPageContent />
    </Suspense>
  );
}
