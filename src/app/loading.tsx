import { ProductGridSkeleton } from "@/components/ui/Loading";

export default function Loading() {
  return (
    <div>
      <div className="mb-6 h-6 w-40 animate-pulse rounded bg-sand" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
