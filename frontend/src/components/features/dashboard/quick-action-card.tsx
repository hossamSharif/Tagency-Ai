'use client';

/**
 * Quick Action Card Component
 *
 * Reusable card component for dashboard quick actions with
 * icon, title, description, and interactive hover effects.
 * Supports different color variants for visual distinction.
 */

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type QuickActionColorVariant = 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  variant?: QuickActionColorVariant;
  className?: string;
}

const variantStyles: Record<QuickActionColorVariant, { card: string; iconBg: string; icon: string }> = {
  blue: {
    card: 'bg-blue-50/50 border-blue-100 hover:border-blue-300 hover:bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 dark:hover:border-blue-700',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    card: 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 dark:hover:border-emerald-700',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    card: 'bg-amber-50/50 border-amber-100 hover:border-amber-300 hover:bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 dark:hover:border-amber-700',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  purple: {
    card: 'bg-purple-50/50 border-purple-100 hover:border-purple-300 hover:bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900 dark:hover:border-purple-700',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  rose: {
    card: 'bg-rose-50/50 border-rose-100 hover:border-rose-300 hover:bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900 dark:hover:border-rose-700',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
    icon: 'text-rose-600 dark:text-rose-400',
  },
};

export function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  variant = 'blue',
  className,
}: QuickActionCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-md',
        'active:scale-[0.98]',
        'p-0',
        styles.card,
        className
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Icon Container */}
        <div className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
          styles.iconBg
        )}>
          <Icon className={cn('h-6 w-6', styles.icon)} />
        </div>

        {/* Text Content */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActionCard;
