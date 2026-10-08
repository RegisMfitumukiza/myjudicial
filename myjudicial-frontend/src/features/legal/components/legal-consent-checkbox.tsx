"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LegalConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
  errorMessage?: string;
  className?: string;
  termsVersion?: string;
}

export function LegalConsentCheckbox({
  checked,
  onChange,
  error,
  errorMessage,
  className,
  termsVersion = "1.0",
}: LegalConsentCheckboxProps) {
  const t = useTranslations("signup.account");

  return (
    <div className={cn("space-y-1", className)}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error}
          aria-describedby={error && errorMessage ? "legal-consent-error" : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="text-xs leading-5 text-muted-foreground select-none">
          {t("terms")}{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            {t("termsLink")}
          </Link>
          {" "}{t("and")}{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            {t("privacyLink")}
          </Link>
        </span>
      </label>
      {error && errorMessage && (
        <p id="legal-consent-error" className="text-xs font-semibold text-red-600 dark:text-red-400 pl-7">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
