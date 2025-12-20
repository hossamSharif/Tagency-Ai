import { Skeleton } from '@/components/ui/skeleton';

export default function SettlementsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-8 w-24" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 ms-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
