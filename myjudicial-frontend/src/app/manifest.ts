import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyJudicial",
    short_name: "MyJudicial",
    description: "Secure, mobile-first legal documentation and case tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0b2545",
    icons: [
      {
        src: "/logo.webp",
        sizes: "192x192",
        type: "image/webp",
      },
      {
        src: "/logo.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
