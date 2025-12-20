'use client';

/**
 * NotificationBell Component
 *
 * Displays notification icon with unread count badge in the header.
 * Opens notification dropdown/sheet on click.
 */

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { NotificationList } from './notification-list';
import { cn } from '@/lib/utils';

export interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const t = useTranslations('notifications');
  const [open, setOpen] = useState(false);
  const { count, loading } = useUnreadCount();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={t('openNotifications')}
        >
          <Bell className="h-5 w-5" />
          {!loading && count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -end-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        <NotificationList
          onClose={() => setOpen(false)}
          maxHeight="400px"
        />
      </PopoverContent>
    </Popover>
  );
}
