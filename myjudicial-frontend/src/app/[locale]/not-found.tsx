import { Link } from "@/i18n/routing";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-canvas px-6 py-12 text-brand-dark">
      <section className="w-full max-w-md space-y-5 text-center">
        <p className="text-sm font-semibold uppercase text-brand-blue">404</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-sm leading-6 text-slate-600">
          The page you are looking for does not exist or may have moved.
        </p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </section>
    </main>
  );
}