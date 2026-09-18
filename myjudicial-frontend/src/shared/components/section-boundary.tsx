"use client";

import { Component, type ReactNode, useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

type BoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type BoundaryState = {
  hasError: boolean;
};

/**
 * Section-level error boundary with retry. If one section's data fetch or
 * render fails, it shows a subtle retry prompt instead of crashing the page.
 */
export class SectionBoundary extends Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[SectionBoundary] Section hidden due to error:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

/**
 * Retry wrapper — reset error state on retry click.
 * Use inside SectionBoundary to provide retry capability.
 */
export function SectionRetryBoundary({ children }: { children: ReactNode }) {
  const [key, setKey] = useState(0);
  const retry = useCallback(() => setKey((k) => k + 1), []);
  const t = useTranslations("common");

  return (
    <SectionBoundary
      fallback={
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("errors.sectionFailed") || "This section failed to load."}</p>
          <button
            onClick={retry}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-dark dark:text-white hover:underline"
          >
            <RefreshCw size={13} /> {t("actions.retry") || "Retry"}
          </button>
        </div>
      }
    >
      <div key={key}>{children}</div>
    </SectionBoundary>
  );
}
