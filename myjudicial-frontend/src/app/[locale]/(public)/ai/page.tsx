import { Suspense } from "react";
import { AiWorkspace } from "@/features/ai/components/ai-workspace";

export default function AiPage() {
  return (
    <Suspense fallback={<AiPageFallback />}>
      <AiWorkspace />
    </Suspense>
  );
}

function AiPageFallback() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}
