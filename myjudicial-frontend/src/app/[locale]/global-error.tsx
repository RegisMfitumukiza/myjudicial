"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", fontFamily: "sans-serif" }}>
          <section style={{ maxWidth: "420px", textAlign: "center" }}>
            <p style={{ color: "rgb(var(--color-brand-blue))", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Error</p>
            <h1>Something went wrong</h1>
            <p>The application could not recover from this error. Please refresh the page.</p>
          </section>
        </main>
      </body>
    </html>
  );
}