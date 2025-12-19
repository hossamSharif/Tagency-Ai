'use client';

/**
 * RTL-Aware Icon Components (T224)
 *
 * Icon components that automatically flip or adjust based on RTL/LTR direction.
 * Uses the current locale to determine direction and applies appropriate
 * transformations to directional icons.
 */

import { forwardRef, type ComponentProps } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ArrowLeftCircle,
  ArrowRightCircle,
  ChevronsLeft,
  ChevronsRight,
  CornerDownLeft,
  CornerDownRight,
  CornerUpLeft,
  CornerUpRight,
  MoveLeft,
  MoveRight,
  Undo,
  Redo,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  type LucideIcon,
} from 'lucide-react';
import { useIsRTL } from '@/hooks/use-user-preferences';
import { cn } from '@/lib/utils';

interface RTLIconProps extends ComponentProps<LucideIcon> {
  /** Force a specific direction instead of using auto-detection */
  forceDirection?: 'ltr' | 'rtl';
}

/**
 * Creates an RTL-aware version of a directional icon pair
 */
function createRTLIcon(LTRIcon: LucideIcon, RTLIcon: LucideIcon) {
  const RTLAwareIcon = forwardRef<SVGSVGElement, RTLIconProps>(
    ({ forceDirection, className, ...props }, ref) => {
      const isRTL = useIsRTL();
      const effectiveRTL = forceDirection ? forceDirection === 'rtl' : isRTL;

      const Icon = effectiveRTL ? RTLIcon : LTRIcon;

      return <Icon ref={ref} className={className} {...props} />;
    }
  );

  RTLAwareIcon.displayName = 'RTLAwareIcon';
  return RTLAwareIcon;
}

/**
 * Creates an icon that flips horizontally in RTL mode
 */
function createFlippableIcon(Icon: LucideIcon) {
  const FlippableIcon = forwardRef<SVGSVGElement, RTLIconProps>(
    ({ forceDirection, className, ...props }, ref) => {
      const isRTL = useIsRTL();
      const effectiveRTL = forceDirection ? forceDirection === 'rtl' : isRTL;

      return (
        <Icon
          ref={ref}
          className={cn(effectiveRTL && 'scale-x-[-1]', className)}
          {...props}
        />
      );
    }
  );

  FlippableIcon.displayName = 'FlippableIcon';
  return FlippableIcon;
}

// ==========================================
// Navigation Icons
// ==========================================

/**
 * Back icon - points left in LTR, right in RTL
 */
export const BackIcon = createRTLIcon(ChevronLeft, ChevronRight);

/**
 * Forward icon - points right in LTR, left in RTL
 */
export const ForwardIcon = createRTLIcon(ChevronRight, ChevronLeft);

/**
 * Previous icon (double chevron) - points left in LTR, right in RTL
 */
export const PreviousIcon = createRTLIcon(ChevronsLeft, ChevronsRight);

/**
 * Next icon (double chevron) - points right in LTR, left in RTL
 */
export const NextIcon = createRTLIcon(ChevronsRight, ChevronsLeft);

// ==========================================
// Arrow Icons
// ==========================================

/**
 * Arrow back - points left in LTR, right in RTL
 */
export const ArrowBackIcon = createRTLIcon(ArrowLeft, ArrowRight);

/**
 * Arrow forward - points right in LTR, left in RTL
 */
export const ArrowForwardIcon = createRTLIcon(ArrowRight, ArrowLeft);

/**
 * Arrow back circle - points left in LTR, right in RTL
 */
export const ArrowBackCircleIcon = createRTLIcon(ArrowLeftCircle, ArrowRightCircle);

/**
 * Arrow forward circle - points right in LTR, left in RTL
 */
export const ArrowForwardCircleIcon = createRTLIcon(ArrowRightCircle, ArrowLeftCircle);

/**
 * Move back - points left in LTR, right in RTL
 */
export const MoveBackIcon = createRTLIcon(MoveLeft, MoveRight);

/**
 * Move forward - points right in LTR, left in RTL
 */
export const MoveForwardIcon = createRTLIcon(MoveRight, MoveLeft);

// ==========================================
// Corner Icons
// ==========================================

/**
 * Corner down back - curves down-left in LTR, down-right in RTL
 */
export const CornerDownBackIcon = createRTLIcon(CornerDownLeft, CornerDownRight);

/**
 * Corner down forward - curves down-right in LTR, down-left in RTL
 */
export const CornerDownForwardIcon = createRTLIcon(CornerDownRight, CornerDownLeft);

/**
 * Corner up back - curves up-left in LTR, up-right in RTL
 */
export const CornerUpBackIcon = createRTLIcon(CornerUpLeft, CornerUpRight);

/**
 * Corner up forward - curves up-right in LTR, up-left in RTL
 */
export const CornerUpForwardIcon = createRTLIcon(CornerUpRight, CornerUpLeft);

// ==========================================
// Action Icons
// ==========================================

/**
 * Undo icon - flips in RTL
 */
export const UndoIcon = createFlippableIcon(Undo);

/**
 * Redo icon - flips in RTL
 */
export const RedoIcon = createFlippableIcon(Redo);

// ==========================================
// Media Icons
// ==========================================

/**
 * Skip back - points left in LTR, right in RTL
 */
export const SkipBackIcon = createRTLIcon(SkipBack, SkipForward);

/**
 * Skip forward - points right in LTR, left in RTL
 */
export const SkipForwardIcon = createRTLIcon(SkipForward, SkipBack);

/**
 * Rewind - flips in RTL
 */
export const RewindIcon = createFlippableIcon(Rewind);

/**
 * Fast forward - flips in RTL
 */
export const FastForwardIcon = createFlippableIcon(FastForward);

// ==========================================
// Utility Components
// ==========================================

interface DirectionalTextProps {
  children: React.ReactNode;
  className?: string;
  /** Force a specific direction */
  dir?: 'ltr' | 'rtl' | 'auto';
}

/**
 * Component that wraps content with correct text direction
 * Useful for mixed content (e.g., phone numbers in RTL text)
 */
export function DirectionalText({ children, className, dir = 'auto' }: DirectionalTextProps) {
  return (
    <span dir={dir} className={className}>
      {children}
    </span>
  );
}

/**
 * Component for LTR content in RTL context (e.g., URLs, code)
 */
export function LTRText({ children, className }: Omit<DirectionalTextProps, 'dir'>) {
  return (
    <span dir="ltr" className={cn('inline-block', className)}>
      {children}
    </span>
  );
}

/**
 * Component for RTL content in LTR context
 */
export function RTLText({ children, className }: Omit<DirectionalTextProps, 'dir'>) {
  return (
    <span dir="rtl" className={cn('inline-block', className)}>
      {children}
    </span>
  );
}

// ==========================================
// Helper Types and Exports
// ==========================================

export type { RTLIconProps };

/**
 * Hook to get directional class names
 * Returns classes like 'start-0', 'end-0' instead of 'left-0', 'right-0'
 */
export function useDirectionalClasses() {
  const isRTL = useIsRTL();

  return {
    /**
     * Get the start position class (left in LTR, right in RTL)
     */
    start: (value: string) => (isRTL ? `right-${value}` : `left-${value}`),

    /**
     * Get the end position class (right in LTR, left in RTL)
     */
    end: (value: string) => (isRTL ? `left-${value}` : `right-${value}`),

    /**
     * Get margin-start class
     */
    ms: (value: string) => (isRTL ? `mr-${value}` : `ml-${value}`),

    /**
     * Get margin-end class
     */
    me: (value: string) => (isRTL ? `ml-${value}` : `mr-${value}`),

    /**
     * Get padding-start class
     */
    ps: (value: string) => (isRTL ? `pr-${value}` : `pl-${value}`),

    /**
     * Get padding-end class
     */
    pe: (value: string) => (isRTL ? `pl-${value}` : `pr-${value}`),

    /**
     * Get text-align-start class
     */
    textStart: isRTL ? 'text-right' : 'text-left',

    /**
     * Get text-align-end class
     */
    textEnd: isRTL ? 'text-left' : 'text-right',

    /**
     * Whether the current direction is RTL
     */
    isRTL,
  };
}
