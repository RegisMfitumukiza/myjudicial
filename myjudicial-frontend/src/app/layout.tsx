import type { Metadata } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { RootProviders } from "@/providers/app-providers";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "MyJudicial | Professional Legal Portal",
  description: "Secure, mobile-first legal documentation and case tracking.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "MyJudicial",
    description: "Secure legal portal",
    url: "https://myjudicial.com",
    siteName: "MyJudicial",
    images: [{ url: "/og-image.png" }],
    locale: "en_US",
    type: "website",
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