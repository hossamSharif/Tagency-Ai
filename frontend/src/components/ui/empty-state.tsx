'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { LucideIcon, Inbox, FileQuestion, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional class names */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'py-8',
    icon: 'h-10 w-10',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base',
  },
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const t = useTranslations('common');
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className={cn('text-muted-foreground', sizes.icon)} />
      </div>

      {title && (
        <h3 className={cn('font-semibold text-foreground mb-1', sizes.title)}>
          {title}
        </h3>
      )}

      {description && (
        <p className={cn('text-muted-foreground max-w-sm mb-4', sizes.description)}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'default'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Empty state for no search results
 */
export function NoSearchResults({
  searchTerm,
  onClear,
}: {
  searchTerm?: string;
  onClear?: () => void;
}) {
  const t = useTranslations('common');

  return (
    <EmptyState
      icon={Search}
      title={t('noResults')}
      description={
        searchTerm
          ? `No results found for "${searchTerm}"`
          : 'Try adjusting your search or filters'
      }
      action={
        onClear
          ? {
              label: t('reset'),
              onClick: onClear,
              variant: 'outline',
            }
          : undefined
      }
      size="sm"
    />
  );
}

/**
 * Empty state for no data
 */
export function NoData({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      action={
        actionLabel && onAction
          ? {
              label: actionLabel,
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

/**
 * Empty state for not found / 404
 */
export function NotFound({
  title = 'Not Found',
  description = 'The page or resource you are looking for does not exist.',
  onGoBack,
}: {
  title?: string;
  description?: string;
  onGoBack?: () => void;
}) {
  const t = useTranslations('common');

  return (
    <EmptyState
      icon={FileQuestion}
      title={title}
      description={description}
      action={
        onGoBack
          ? {
              label: t('back'),
              onClick: onGoBack,
              variant: 'outline',
            }
          : undefined
      }
      size="lg"
    />
  );
}

export default EmptyState;
