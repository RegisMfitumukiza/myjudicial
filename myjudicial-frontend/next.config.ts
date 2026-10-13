import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from 'next-intl/plugin';
import path from "path";

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/**",
      },
    ],
  },
  turbopack: {
    // Explicitly set the root to silence the multiple-lockfiles warning
    root: path.resolve(__dirname),
    // next-auth@beta.31 imports from "next/server" and "next/headers" (no .js) in ESM mode.
    // Next.js 16 has no package.json "exports" field, so Turbopack cannot
    // resolve the bare specifier. Map it to the actual file.
    resolveAlias: {
      "next/server": "next/server.js",
      "next/headers": "next/headers.js",
    },
  },
    // Same alias for the webpack bundler (production builds / non-turbopack)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "next/server": path.resolve(__dirname, "node_modules/next/server.js"),
      "next/headers": path.resolve(__dirname, "node_modules/next/headers.js"),
    };
    return config;
  },
  allowedDevOrigins: ["172.20.10.3"],
  redirects: async () => [
    {
      source: "/sign-in",
      destination: "/en/sign-in",
      permanent: false,
    },
    {
      source: "/admin/dashboard",
      destination: "/en/admin/dashboard",
      permanent: false,
    },
    {
      source: "/expert/dashboard",
      destination: "/en/expert/dashboard",
      permanent: false,
    },
    {
      source: "/client/dashboard",
      destination: "/en/client/dashboard",
      permanent: false,
    },
    {
      source: "/auth/expert-register",
      destination: "/en/sign-up?role=EXPERT",
      permanent: false,
    },
    {
      source: "/:locale/auth/expert-register",
      destination: "/:locale/sign-up?role=EXPERT",
      permanent: false,
    },
  ],
};

export default withNextIntl(withPWA(nextConfig));
