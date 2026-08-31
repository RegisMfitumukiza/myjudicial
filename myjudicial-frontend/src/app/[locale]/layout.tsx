import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Toaster } from "@/components/ui/sonner";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      getMessageFallback={({ namespace, key }) =>
        // Graceful fallback: never surface the raw dot-notation path if a
        // translation is missing. Derive a readable title-case label instead.
        key
          .split(".")
          .filter(Boolean)
          .pop()
          ?.replace(/([A-Z])/g, " $1")
          .replace(/^./, (c) => c.toUpperCase()) ||
        `${namespace}.${key}`
      }
    >
      {children}
      <Toaster position="top-right" richColors closeButton />
    </NextIntlClientProvider>
  );
}
