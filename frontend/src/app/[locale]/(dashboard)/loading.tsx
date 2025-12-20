import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
}
