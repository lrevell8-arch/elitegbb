import { SkeletonCard } from "@/components/ui";

export default function PublicLoading() {
  return (
    <div className="space-y-4">
      <SkeletonCard rows={5} columns={1} />
      <SkeletonCard rows={4} columns={2} />
    </div>
  );
}
