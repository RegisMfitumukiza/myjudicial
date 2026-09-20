import { Suspense } from "react";
import { AiWorkspace } from "@/features/ai/components/ai-workspace";
import { useTranslations } from "next-intl";

export default function AiPage() {
  return (
    <Suspense fallback={<AiPageFallback />}>
      <AiWorkspace />
    </Suspense>
  );
}

function AiPageFallback() {
  const t = useTranslations("common");
  return (
    <div className="flex h-[60vh] w-full items-center justify-center text-sm text-muted-foreground">
      {t("loading")}
    </div>
  );
}
