"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-canvas px-6 py-12 text-brand-dark">
      <section className="w-full max-w-md space-y-5 text-center">
        <p className="text-sm font-semibold uppercase text-brand-blue">Error</p>
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="text-sm leading-6 text-slate-600">
          The request could not be completed. You can try again.
        </p>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </section>
    </main>
  );
}