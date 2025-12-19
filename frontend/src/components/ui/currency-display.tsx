'use client';

/**
 * Currency Display Component (T215)
 *
 * Displays amounts in the tenant's configured currency with proper formatting
 */

import { useTenant } from '@/hooks/use-tenant';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  /** The amount to display */
  amount: number;
  /** Optional currency override (uses tenant currency by default) */
  currency?: string;
  /** Whether to show the currency symbol */
  showSymbol?: boolean;
  /** Whether to show the currency code (e.g., SAR) */
  showCode?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Variant for styling */
  variant?: 'default' | 'positive' | 'negative' | 'muted';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show decimals */
  showDecimals?: boolean;
  /** Number of decimal places */
  decimals?: number;
}

export function CurrencyDisplay({
  amount,
  currency,
  showSymbol = true,
  showCode = false,
  className,
  variant = 'default',
  size = 'md',
  showDecimals = true,
  decimals = 2,
}: CurrencyDisplayProps) {
  const { formatCurrency, getCurrencySymbol, tenant } = useTenant();

  // Determine the currency to use
  const displayCurrency = currency || tenant?.currency || 'SAR';
  const locale = tenant?.language === 'ar' ? 'ar-SA' : 'en-US';

  // Format the number
  const formatNumber = (num: number): string => {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: showDecimals ? decimals : 0,
      maximumFractionDigits: showDecimals ? decimals : 0,
    };

    return new Intl.NumberFormat(locale, options).format(num);
  };

  // Get the formatted amount
  const formattedAmount = formatNumber(Math.abs(amount));
  const isNegative = amount < 0;

  // Variant styles
  const variantStyles = {
    default: '',
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    muted: 'text-muted-foreground',
  };

  // Size styles
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-medium',
    xl: 'text-2xl font-semibold',
  };

  // Automatically use negative variant for negative amounts
  const effectiveVariant = variant === 'default' && isNegative ? 'negative' : variant;

  // Build the display string
  const buildDisplay = (): string => {
    const parts: string[] = [];

    // Add negative sign if applicable
    if (isNegative) {
      parts.push('-');
    }

    // Add symbol if requested
    if (showSymbol) {
      parts.push(getCurrencySymbol());
      parts.push(' ');
    }

    // Add the amount
    parts.push(formattedAmount);

    // Add code if requested
    if (showCode) {
      parts.push(' ');
      parts.push(displayCurrency);
    }

    return parts.join('');
  };

  return (
    <span
      className={cn(
        'tabular-nums',
        variantStyles[effectiveVariant],
        sizeStyles[size],
        className
      )}
      dir="ltr"
    >
      {buildDisplay()}
    </span>
  );
}

/**
 * Simple currency format hook for use in server components or custom formatting
 */
export function formatCurrencyValue(
  amount: number,
  currency: string = 'SAR',
  locale: string = 'ar-SA',
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch {
    // Fallback for unsupported currencies
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Balance display component - shows positive/negative with appropriate styling
 */
interface BalanceDisplayProps extends Omit<CurrencyDisplayProps, 'variant'> {
  /** Whether positive amounts mean the user owes money */
  invertColors?: boolean;
}

export function BalanceDisplay({ amount, invertColors = false, ...props }: BalanceDisplayProps) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;

  let variant: CurrencyDisplayProps['variant'] = 'default';

  if (isPositive) {
    variant = invertColors ? 'negative' : 'positive';
  } else if (isNegative) {
    variant = invertColors ? 'positive' : 'negative';
  } else {
    variant = 'muted';
  }

  return <CurrencyDisplay amount={amount} variant={variant} {...props} />;
}

/**
 * Price range display component
 */
interface PriceRangeProps {
  min: number;
  max: number;
  currency?: string;
  className?: string;
  size?: CurrencyDisplayProps['size'];
}

export function PriceRange({ min, max, currency, className, size = 'md' }: PriceRangeProps) {
  const { getCurrencySymbol, tenant } = useTenant();
  const locale = tenant?.language === 'ar' ? 'ar-SA' : 'en-US';
  const symbol = getCurrencySymbol();

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-medium',
    xl: 'text-2xl font-semibold',
  };

  return (
    <span className={cn('tabular-nums', sizeStyles[size], className)} dir="ltr">
      {symbol} {formatNumber(min)} - {formatNumber(max)}
    </span>
  );
}

/**
 * Percentage display component
 */
interface PercentageDisplayProps {
  value: number;
  showSign?: boolean;
  className?: string;
  size?: CurrencyDisplayProps['size'];
  variant?: CurrencyDisplayProps['variant'];
}

export function PercentageDisplay({
  value,
  showSign = false,
  className,
  size = 'md',
  variant = 'default',
}: PercentageDisplayProps) {
  const { tenant } = useTenant();
  const locale = tenant?.language === 'ar' ? 'ar-SA' : 'en-US';

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  const sign = value > 0 && showSign ? '+' : value < 0 ? '-' : '';

  const variantStyles = {
    default: '',
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    muted: 'text-muted-foreground',
  };

  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-medium',
    xl: 'text-2xl font-semibold',
  };

  // Auto-color based on value
  const effectiveVariant =
    variant === 'default'
      ? value > 0
        ? 'positive'
        : value < 0
        ? 'negative'
        : 'muted'
      : variant;

  return (
    <span
      className={cn('tabular-nums', variantStyles[effectiveVariant], sizeStyles[size], className)}
    >
      {sign}
      {formatted}%
    </span>
  );
}
