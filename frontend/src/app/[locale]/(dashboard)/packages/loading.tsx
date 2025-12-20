import { Skeleton } from '@/components/ui/skeleton';

export default function PackagesLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Package cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
