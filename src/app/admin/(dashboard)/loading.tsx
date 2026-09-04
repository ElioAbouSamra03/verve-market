import { LineSkeleton } from "@/components/ui/Loading";

export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <LineSkeleton className="h-7 w-40" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-line bg-white p-5">
            <LineSkeleton className="h-3 w-20" />
            <LineSkeleton className="mt-3 h-8 w-14" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LineSkeleton className="h-64 w-full" />
        <LineSkeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
