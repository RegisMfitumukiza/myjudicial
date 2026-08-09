"use client";

import { Suspense } from "react";
import { MessagesPanel } from "@/features/chat/components/messages-panel";
import { useTranslations } from "next-intl";

export default function AdminMessagesPage() {
  const t = useTranslations("admin.dashboard");
  return (
    <Suspense>
      <MessagesPanel subtitle={t("subtitle")} />
    </Suspense>
  );
}
