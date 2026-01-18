'use client';

/**
 * GlowingBorder Component
 *
 * Reusable decorative component that wraps content with an animated gradient border
 * and glowing effect. Uses primary-to-accent gradient (Saudi Green → Muted Gold).
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface GlowingBorderProps {
  children: ReactNode;
  className?: string;
}

export function GlowingBorder({ children, className }: GlowingBorderProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Animated gradient background blur effect */}
      <div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-shift opacity-20 blur-md"
        aria-hidden="true"
      />

      {/* Main content container */}
      <div className="relative rounded-2xl bg-background p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
}
