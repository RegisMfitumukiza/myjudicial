import { CardGridSkeleton } from "@/shared/components/dashboard/loading";

export default function PracticeAreasLoading() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-8 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading practice areas"
    >
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <div className="h-8 w-56 rounded-xl bg-muted mx-auto" />
        <div className="h-4 w-96 max-w-full rounded bg-muted mx-auto" />
      </div>
      <CardGridSkeleton count={6} columns={3} />
    </div>
  );
}
