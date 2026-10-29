import { SkeletonList } from "@/shared/components/dashboard/loading";

export default function Loading() {
  return <SkeletonList count={7} itemClassName="h-16 rounded-xl" />;
}
