'use client';

/**
 * Subscription Guard Component
 *
 * T210: Client-side subscription check for dashboard layout.
 * Displays appropriate UI for trial/expired subscriptions.
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';
import { TrialBanner } from './trial-banner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock, CreditCard, Clock } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  locale: string;
}

/**
 * Routes that are always accessible regardless of subscription status
 */
const ALWAYS_ACCESSIBLE_ROUTES = [
  '/settings/subscription',
  '/subscription/success',
  '/subscription/cancelled',
  '/auth',
];

/**
 * Check if current path is always accessible
 */
function isAlwaysAccessible(pathname: string): boolean {
  return ALWAYS_ACCESSIBLE_ROUTES.some((route) => pathname.includes(route));
}

export function SubscriptionGuard({ children, locale }: SubscriptionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    hasAccess,
    loading,
    isTrial,
    isExpired,
    isPendingPayment,
    isPastDue,
    trialDaysRemaining,
    message,
    messageAr,
  } = useSubscriptionStatus();
  const isArabic = locale === 'ar';

  // Allow access to subscription-related pages
  if (isAlwaysAccessible(pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // No access - show appropriate blocked UI
  if (!hasAccess) {
    return <SubscriptionBlockedUI locale={locale} />;
  }

  // Has access - render children with optional trial banner
  return (
    <>
      {/* Show trial banner if in trial */}
      {isTrial && <TrialBanner locale={isArabic ? 'ar' : 'en'} />}

      {/* Show past due warning */}
      {isPastDue && <PastDueWarning locale={locale} />}

      {children}
    </>
  );
}

/**
 * UI shown when subscription access is blocked
 */
function SubscriptionBlockedUI({ locale }: { locale: string }) {
  const router = useRouter();
  const { isExpired, isPendingPayment, message, messageAr } = useSubscriptionStatus();
  const isArabic = locale === 'ar';

  const handleSubscribe = () => {
    router.push(`/${locale}/settings/subscription`);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            {isPendingPayment ? (
              <Clock className="h-10 w-10 text-amber-600" />
            ) : (
              <Lock className="h-10 w-10 text-amber-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isPendingPayment
              ? isArabic
                ? 'في انتظار تأكيد الدفع'
                : 'Awaiting Payment Confirmation'
              : isArabic
              ? 'الاشتراك مطلوب'
              : 'Subscription Required'}
          </CardTitle>
          <CardDescription className="text-base">
            {isPendingPayment
              ? isArabic
                ? 'تم استلام طلب الدفع الخاص بك وهو قيد المراجعة.'
                : 'Your payment request has been received and is under review.'
              : isArabic
              ? messageAr
              : message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPendingPayment && (
            <Button className="w-full gap-2" onClick={handleSubscribe}>
              <CreditCard className="h-4 w-4" />
              {isArabic ? 'الاشتراك الآن' : 'Subscribe Now'}
            </Button>
          )}

          {isPendingPayment && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-start">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {isArabic
                  ? 'سيتم تفعيل حسابك بمجرد التحقق من الدفع. عادة ما يستغرق هذا 1-2 يوم عمل.'
                  : 'Your account will be activated once payment is verified. This usually takes 1-2 business days.'}
              </p>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleSubscribe}
          >
            {isArabic ? 'عرض حالة الاشتراك' : 'View Subscription Status'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Warning shown when subscription is past due
 */
function PastDueWarning({ locale }: { locale: string }) {
  const router = useRouter();
  const isArabic = locale === 'ar';

  return (
    <div className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            {isArabic ? 'الدفع متأخر' : 'Payment Past Due'}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {isArabic
              ? 'فشلت عملية الدفع الأخيرة. يرجى تحديث طريقة الدفع لتجنب انقطاع الخدمة.'
              : 'Your last payment failed. Please update your payment method to avoid service interruption.'}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => router.push(`/${locale}/settings/subscription`)}
        >
          {isArabic ? 'تحديث الدفع' : 'Update Payment'}
        </Button>
      </div>
    </div>
  );
}
