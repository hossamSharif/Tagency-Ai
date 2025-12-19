'use client';

/**
 * Subscription Card Component
 *
 * T202: Full subscription details card with actions.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/use-subscription';
import { SUBSCRIPTION_STATUS_INFO, SUBSCRIPTION_PAYMENT_STATUS_INFO } from '@/types/models/subscription';
import { PRICING, SUBSCRIPTION_FEATURES } from '@/lib/stripe/config';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  createSubscriptionCheckoutAction,
  createBillingPortalAction,
  cancelSubscriptionAction,
  reactivateSubscriptionAction,
} from '@/app/actions/subscriptions';

interface SubscriptionCardProps {
  locale?: 'ar' | 'en';
}

export function SubscriptionCard({ locale = 'en' }: SubscriptionCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { subscription, statusCheck, loading, trialDaysRemaining, refresh } = useSubscription();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isArabic = locale === 'ar';
  const dateLocale = isArabic ? arSA : enUS;

  const features = SUBSCRIPTION_FEATURES[isArabic ? 'ar' : 'en'];
  const monthlyPrice = PRICING.monthlyPriceAmount / 100;

  const handleSubscribe = async () => {
    setIsSubmitting(true);
    try {
      const baseUrl = window.location.origin;
      const result = await createSubscriptionCheckoutAction({
        successUrl: `${baseUrl}/${locale}/subscription/success`,
        cancelUrl: `${baseUrl}/${locale}/subscription/cancelled`,
      });

      if (!result.success) {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: result.error || (isArabic ? 'فشل بدء عملية الدفع' : 'Failed to start checkout'),
          variant: 'destructive',
        });
        return;
      }
      window.location.href = result.data.checkoutUrl;
    } catch (err) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageBilling = async () => {
    setIsSubmitting(true);
    try {
      const result = await createBillingPortalAction({
        returnUrl: window.location.href,
      });

      if (!result.success) {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: result.error || (isArabic ? 'فشل فتح لوحة الفوترة' : 'Failed to open billing portal'),
          variant: 'destructive',
        });
        return;
      }
      window.location.href = result.data.portalUrl;
    } catch (err) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(isArabic ? 'هل أنت متأكد من إلغاء الاشتراك؟' : 'Are you sure you want to cancel your subscription?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await cancelSubscriptionAction({});

      if (!result.success) {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: isArabic ? 'تم الإلغاء' : 'Cancelled',
        description: isArabic
          ? `سيتم إلغاء اشتراكك في ${format(result.data.accessUntil, 'PPP', { locale: dateLocale })}`
          : `Your subscription will end on ${format(result.data.accessUntil, 'PPP', { locale: dateLocale })}`,
      });
      refresh();
    } catch (err) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivate = async () => {
    setIsSubmitting(true);
    try {
      const result = await reactivateSubscriptionAction();

      if (result.success) {
        toast({
          title: isArabic ? 'تم التفعيل' : 'Reactivated',
          description: isArabic ? 'تم إعادة تفعيل اشتراكك' : 'Your subscription has been reactivated',
        });
        refresh();
      } else {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankTransfer = () => {
    router.push(`/${locale}/settings/subscription?method=bank`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{isArabic ? 'جاري التحميل...' : 'Loading...'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = subscription ? SUBSCRIPTION_STATUS_INFO[subscription.status] : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{isArabic ? 'خطة الاشتراك' : 'Subscription Plan'}</CardTitle>
            <CardDescription>
              {subscription?.plan === 'monthly'
                ? isArabic
                  ? 'الخطة الشهرية'
                  : 'Monthly Plan'
                : isArabic
                ? 'الفترة التجريبية'
                : 'Trial Period'}
            </CardDescription>
          </div>
          {statusInfo && (
            <Badge
              variant={
                statusInfo.color === 'green'
                  ? 'default'
                  : statusInfo.color === 'yellow'
                  ? 'secondary'
                  : statusInfo.color === 'red'
                  ? 'destructive'
                  : 'outline'
              }
            >
              {isArabic ? statusInfo.labelAr : statusInfo.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">${monthlyPrice}</span>
          <span className="text-muted-foreground">
            /{isArabic ? 'شهر' : 'month'}
          </span>
        </div>

        {/* Trial info */}
        {subscription?.plan === 'trial' && trialDaysRemaining > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
            <Clock className="h-5 w-5" />
            <span>
              {isArabic
                ? `${trialDaysRemaining} يوم متبقي في الفترة التجريبية`
                : `${trialDaysRemaining} days left in trial`}
            </span>
          </div>
        )}

        {/* Past due warning */}
        {subscription?.status === 'past_due' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5" />
            <span>
              {isArabic
                ? 'الدفع متأخر - يرجى تحديث طريقة الدفع'
                : 'Payment past due - please update payment method'}
            </span>
          </div>
        )}

        {/* Pending payment info */}
        {subscription?.status === 'pending_payment' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
            <Clock className="h-5 w-5" />
            <span>
              {isArabic
                ? 'في انتظار تأكيد الدفع'
                : 'Awaiting payment confirmation'}
            </span>
          </div>
        )}

        {/* Billing period */}
        {subscription?.currentPeriodEnd && subscription?.plan === 'monthly' && (
          <p className="text-sm text-muted-foreground">
            {subscription.status === 'cancelled'
              ? isArabic
                ? 'ينتهي الاشتراك في: '
                : 'Access until: '
              : isArabic
              ? 'يتجدد في: '
              : 'Renews: '}
            {format(subscription.currentPeriodEnd.toDate(), 'PPP', { locale: dateLocale })}
          </p>
        )}

        <Separator />

        {/* Features */}
        <div>
          <h4 className="font-medium mb-2">{isArabic ? 'الميزات المضمنة:' : 'Included features:'}</h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {/* Show different actions based on subscription state */}
        {(!subscription || subscription.plan === 'trial' || subscription.status === 'expired') && (
          <>
            <Button className="w-full gap-2" onClick={handleSubscribe} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {isArabic ? 'الاشتراك بالبطاقة' : 'Subscribe with Card'}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleBankTransfer}
              disabled={isSubmitting}
            >
              <Building2 className="h-4 w-4" />
              {isArabic ? 'التحويل البنكي' : 'Bank Transfer'}
            </Button>
          </>
        )}

        {subscription?.plan === 'monthly' && subscription.status === 'active' && (
          <>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleManageBilling}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              {isArabic ? 'إدارة الفوترة' : 'Manage Billing'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isArabic ? 'إلغاء الاشتراك' : 'Cancel Subscription'}
            </Button>
          </>
        )}

        {subscription?.status === 'cancelled' && (
          <Button className="w-full gap-2" onClick={handleReactivate} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isArabic ? 'إعادة تفعيل الاشتراك' : 'Reactivate Subscription'}
          </Button>
        )}

        {subscription?.status === 'past_due' && (
          <Button
            className="w-full gap-2"
            onClick={handleManageBilling}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {isArabic ? 'تحديث طريقة الدفع' : 'Update Payment Method'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
