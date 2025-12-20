import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
