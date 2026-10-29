import { CardGridSkeleton } from "@/shared/components/dashboard/loading";

export default function HowItWorksLoading() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-10 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading how it works"
    >
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <div className="h-8 w-52 rounded-xl bg-muted mx-auto" />
        <div className="h-4 w-96 max-w-full rounded bg-muted mx-auto" />
      </div>
      <CardGridSkeleton count={4} columns={4} />
    </div>
  );
}
