import { SkeletonList } from "@/shared/components/dashboard/loading";

export default function Loading() {
  return <SkeletonList count={3} itemClassName="h-28 rounded-2xl" />;
}
