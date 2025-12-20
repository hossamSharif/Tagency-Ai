'use client';

/**
 * Notifications Page
 *
 * Full page view of all notifications with filtering and management options.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Filter,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationItem } from '@/components/features/notifications/notification-item';
import Link from 'next/link';

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const params = useParams();
  const locale = params.locale as string;

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications({
    limit: 100,
    unreadOnly: activeTab === 'unread',
  });

  const handleClearRead = async () => {
    await clearReadNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            {t('pageTitle')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('pageDescription')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${locale}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 me-2" />
              {t('preferences')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  {t('all')}
                  <Badge variant="secondary" className="text-xs">
                    {notifications.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="unread" className="gap-2">
                  {t('unread')}
                  {unreadCount > 0 && (
                    <Badge variant="default" className="text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="h-4 w-4 me-2" />
                  {t('markAllRead')}
                </Button>
              )}

              {notifications.some((n) => n.read) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 me-2" />
                      {t('clearRead')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('clearReadTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('clearReadDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearRead}>
                        {t('confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <BellOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">
                {activeTab === 'unread' ? t('noUnread') : t('noNotifications')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {activeTab === 'unread'
                  ? t('noUnreadDescription')
                  : t('noNotificationsDescription')}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                  locale={locale}
                  showActions
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
