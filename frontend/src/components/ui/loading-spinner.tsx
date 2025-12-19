'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional text to show below spinner */
  text?: string;
  /** Whether to show the default loading text */
  showText?: boolean;
  /** Additional class names */
  className?: string;
  /** Whether to center in container */
  centered?: boolean;
  /** Whether to take full height */
  fullHeight?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function LoadingSpinner({
  size = 'md',
  text,
  showText = true,
  className,
  centered = true,
  fullHeight = false,
}: LoadingSpinnerProps) {
  const t = useTranslations('common');
  const displayText = text || (showText ? t('loading') : undefined);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        centered && 'w-full',
        fullHeight && 'min-h-[200px]',
        className
      )}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {displayText && (
        <p className="text-sm text-muted-foreground">{displayText}</p>
      )}
    </div>
  );
}

/**
 * Loading overlay for covering content while loading
 */
export function LoadingOverlay({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50',
        className
      )}
    >
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

/**
 * Full page loading state
 */
export function PageLoading({ text }: { text?: string }) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

export default LoadingSpinner;
