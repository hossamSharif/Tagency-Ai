// Confidence Badge Component
// Color-coded indicator showing OCR confidence level

import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  confidence: number; // 0-100
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  label,
  showIcon = true,
  className,
}: ConfidenceBadgeProps) {
  // Determine color and icon based on confidence level
  const isHigh = confidence >= 80;
  const isMedium = confidence >= 50 && confidence < 80;
  const isLow = confidence < 50;

  const colorClasses = isHigh
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    : isMedium
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const Icon = isHigh ? CheckCircle2 : isMedium ? AlertCircle : XCircle;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        colorClasses,
        isLow && 'animate-pulse',
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{Math.round(confidence)}%</span>
      {label && <span className="text-[10px] opacity-75">| {label}</span>}
    </div>
  );
}
