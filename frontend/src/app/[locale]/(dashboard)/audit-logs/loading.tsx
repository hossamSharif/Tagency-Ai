import { Skeleton } from '@/components/ui/skeleton';

export default function AuditLogsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Audit log entries */}
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      <div className="flex justify-center">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
