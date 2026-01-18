'use client';

/**
 * ShowcaseSlide Component
 *
 * Wrapper component for individual feature showcase slides.
 * Provides consistent structure for showcase content.
 * Note: Animation is handled by parent component in hero-showcase-slider.tsx
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ShowcaseSlideProps {
  children: ReactNode;
  direction: number;
  title: string;
  className?: string;
}

export function ShowcaseSlide({
  children,
  direction,
  title,
  className,
}: ShowcaseSlideProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Showcase content */}
      <div className="space-y-3">
        {/* Feature title - at top */}
        <h3 className="text-center text-sm font-semibold text-foreground">
          {title}
        </h3>

        {children}
      </div>
    </div>
  );
}
