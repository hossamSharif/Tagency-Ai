'use client';

/**
 * NotificationList Component
 *
 * Displays a scrollable list of notifications with actions.
 */

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCheck, Trash2, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { cn } from '@/lib/utils';

export interface NotificationListProps {
  className?: string;
  maxHeight?: string;
  onClose?: () => void;
}

export function NotificationList({
  className,
  maxHeight = '400px',
  onClose,
}: NotificationListProps) {
  const t = useTranslations('notifications');
  const params = useParams();
  const locale = params.locale as string;

  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ limit: 20 });

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = async (notificationId: string, actionUrl?: string) => {
    await markAsRead(notificationId);
    if (onClose) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className={cn('p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">{t('title')}</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="h-4 w-4 me-1" />
            {t('markAllRead')}
          </Button>
        )}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <BellOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <ScrollArea style={{ maxHeight }}>
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() =>
                  handleNotificationClick(notification.id, notification.actionUrl)
                }
                onDelete={() => deleteNotification(notification.id)}
                locale={locale}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Link
              href={`/${locale}/notifications`}
              onClick={onClose}
              className="block w-full"
            >
              <Button variant="ghost" size="sm" className="w-full text-xs">
                {t('viewAll')}
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
