import { SkeletonList } from "@/shared/components/dashboard/loading";

export default function Loading() {
  return <SkeletonList count={4} itemClassName="h-20 rounded-xl" />;
}
