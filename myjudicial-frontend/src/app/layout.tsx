import type { Metadata } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { RootProviders } from "@/providers/app-providers";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'MyJudicial | Find Verified Legal Experts in Rwanda',
    template: '%s | MyJudicial',
  },
  description: 'Browse verified lawyers, compare fixed fees, and book legal consultations instantly. Rwanda\'s leading legal services marketplace.',
  keywords: [
    'lawyer Rwanda', 'avocat Rwanda', 'legal services Kigali',
    'book lawyer online', 'legal consultation', 'avocats Kigali',
    'legal expert Rwanda', 'MyJudicial', 'Rwandan law',
  ],
  authors: [{ name: 'MyJudicial', url: 'https://myjudicial.com' }],
  creator: 'MyJudicial',
  publisher: 'MyJudicial',
  icons: {
    icon: [
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'MyJudicial | Find Verified Legal Experts in Rwanda',
    description: 'Browse verified lawyers, compare fixed fees, and book legal consultations instantly.',
    url: 'https://myjudicial.com',
    siteName: 'MyJudicial',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'MyJudicial — Legal Services Marketplace',
    }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@myjudicial',
    creator: '@myjudicial',
    title: 'MyJudicial | Find Verified Legal Experts in Rwanda',
    description: 'Browse verified lawyers, compare fixed fees, and book legal consultations instantly.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}