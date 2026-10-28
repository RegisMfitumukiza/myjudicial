"use client";

/**
 * Expert Profile Photo Reminder Demo Page
 *
 * Development-only design review page. Not linked from any user-facing navigation.
 * Returns 404 in production to prevent public access to demo scaffolding.
 */
import { notFound } from "next/navigation";

export default function PhotoReminderDemo() {
  // Guard: this page must not be publicly accessible in production
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/20">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
          Development Only
        </p>
        <h1 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
          Profile Photo Reminder Demo
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          This page is a design review sandbox for profile photo reminder
          components. It is not part of the production user flow and is only
          accessible in development and preview environments.
        </p>
      </div>
    </div>
  );
}
