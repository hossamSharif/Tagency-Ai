'use client';

/**
 * NotificationItem Component
 *
 * Individual notification item with icon, title, body, and actions.
 */

import { memo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  CalendarCheck,
  CalendarX,
  FileQuestion,
  FileCheck,
  FileX,
  Package,
  Banknote,
  Clock,
  AlertTriangle,
  UserPlus,
  Bell,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Notification, type NotificationType, NOTIFICATION_TYPE_INFO } from '@/types/models/notification';
import { cn } from '@/lib/utils';

export interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  onDelete?: () => void;
  locale?: string;
  showActions?: boolean;
}

const iconMap: Record<NotificationType, typeof Bell> = {
  payment_received: DollarSign,
  payment_approved: CheckCircle,
  payment_rejected: XCircle,
  booking_confirmed: CalendarCheck,
  booking_cancelled: CalendarX,
  document_requested: FileQuestion,
  document_verified: FileCheck,
  document_rejected: FileX,
  package_updated: Package,
  commission_settled: Banknote,
  subscription_expiring: Clock,
  subscription_expired: AlertTriangle,
  trial_ending: Clock,
  user_invited: UserPlus,
  general: Bell,
};

const colorMap: Record<string, string> = {
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
};

function NotificationItemComponent({
  notification,
  onClick,
  onDelete,
  locale = 'ar',
  showActions = true,
}: NotificationItemProps) {
  const typeInfo = NOTIFICATION_TYPE_INFO[notification.type];
  const Icon = iconMap[notification.type] || Bell;
  const iconColorClass = colorMap[typeInfo?.color || 'gray'];

  // Format the time
  const timeAgo = formatDistanceToNow(
    notification.createdAt?.toDate?.() || new Date(),
    {
      addSuffix: true,
      locale: locale === 'ar' ? ar : enUS,
    }
  );

  const content = (
    <div
      className={cn(
        'flex gap-3 p-3 transition-colors cursor-pointer hover:bg-muted/50',
        !notification.read && 'bg-primary/5'
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          iconColorClass
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm line-clamp-1',
              !notification.read && 'font-medium'
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>

      {/* Actions */}
      {showActions && onDelete && (
        <div
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 me-2" />
                {locale === 'ar' ? 'حذف' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  // Wrap with link if action URL exists
  if (notification.actionUrl) {
    return (
      <Link href={`/${locale}${notification.actionUrl}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export const NotificationItem = memo(NotificationItemComponent);
