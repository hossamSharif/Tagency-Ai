'use client';

/**
 * Trial Banner Component
 *
 * T201: Banner displayed when trial is ending soon.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';
import { Clock, X, CreditCard } from 'lucide-react';

interface TrialBannerProps {
  locale?: 'ar' | 'en';
}

export function TrialBanner({ locale = 'en' }: TrialBannerProps) {
  const router = useRouter();
  const { isTrial, isTrialEndingSoon, trialDaysRemaining, hasAccess, loading } =
    useSubscriptionStatus();
  const [dismissed, setDismissed] = useState(false);
  const isArabic = locale === 'ar';

  // Don't show if loading, dismissed, not on trial, or trial not ending soon
  if (loading || dismissed || !isTrial || !hasAccess) {
    return null;
  }

  // Only show for trials with 7 or fewer days remaining
  if (trialDaysRemaining > 7) {
    return null;
  }

  const handleSubscribe = () => {
    router.push(`/${locale}/settings/subscription`);
  };

  const getUrgencyColor = () => {
    if (trialDaysRemaining <= 1) return 'border-red-500 bg-red-50 dark:bg-red-950';
    if (trialDaysRemaining <= 3) return 'border-amber-500 bg-amber-50 dark:bg-amber-950';
    return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
  };

  const getMessage = () => {
    if (trialDaysRemaining === 0) {
      return isArabic
        ? 'تنتهي فترتك التجريبية اليوم!'
        : 'Your trial expires today!';
    }
    if (trialDaysRemaining === 1) {
      return isArabic
        ? 'تنتهي فترتك التجريبية غداً!'
        : 'Your trial expires tomorrow!';
    }
    return isArabic
      ? `تنتهي فترتك التجريبية خلال ${trialDaysRemaining} أيام`
      : `Your trial expires in ${trialDaysRemaining} days`;
  };

  return (
    <Alert className={`relative ${getUrgencyColor()}`}>
      <Clock className="h-4 w-4" />
      <AlertTitle className="font-semibold">
        {isArabic ? 'الفترة التجريبية' : 'Trial Period'}
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>{getMessage()}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSubscribe} className="gap-1">
            <CreditCard className="h-4 w-4" />
            {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{isArabic ? 'إخفاء' : 'Dismiss'}</span>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Compact trial badge for header/nav
 */
export function TrialBadge({ locale = 'en' }: { locale?: 'ar' | 'en' }) {
  const router = useRouter();
  const { isTrial, trialDaysRemaining, hasAccess, loading } = useSubscriptionStatus();
  const isArabic = locale === 'ar';

  if (loading || !isTrial || !hasAccess || trialDaysRemaining > 14) {
    return null;
  }

  const getUrgencyStyle = () => {
    if (trialDaysRemaining <= 1) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (trialDaysRemaining <= 3) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  return (
    <button
      onClick={() => router.push(`/${locale}/settings/subscription`)}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${getUrgencyStyle()}`}
    >
      <Clock className="h-3 w-3" />
      {isArabic
        ? `${trialDaysRemaining} يوم`
        : `${trialDaysRemaining}d left`}
    </button>
  );
}
