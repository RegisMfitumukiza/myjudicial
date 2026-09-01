"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import type { ReactNode } from "react";

type IntlProviderProps = {
  locale: string;
  messages: AbstractIntlMessages;
  children: ReactNode;
};

/**
 * Client-side wrapper around NextIntlClientProvider.
 * Defines getMessageFallback here (inside a Client Component) so the function
 * never crosses the RSC serialization boundary, which would otherwise throw:
 * "Functions cannot be passed directly to Client Components".
 */
export function IntlProvider({ locale, messages, children }: IntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      getMessageFallback={({ key }) =>
        // Graceful fallback: never surface the raw dot-notation path if a
        // translation is missing. Derive a readable title-case label instead.
        key
          .split(".")
          .filter(Boolean)
          .pop()
          ?.replace(/([A-Z])/g, " $1")
          .replace(/^./, (c) => c.toUpperCase()) || key
      }
    >
      {children}
    </NextIntlClientProvider>
  );
}
