'use client';

/**
 * Subscription Status Component
 *
 * T200: Displays current subscription status with badges and messages.
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/use-subscription';
import { SUBSCRIPTION_STATUS_INFO } from '@/types/models/subscription';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Clock, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

interface SubscriptionStatusProps {
  locale?: 'ar' | 'en';
  showCard?: boolean;
}

export function SubscriptionStatus({ locale = 'en', showCard = true }: SubscriptionStatusProps) {
  const { subscription, statusCheck, loading, trialDaysRemaining } = useSubscription();
  const isArabic = locale === 'ar';
  const dateLocale = isArabic ? arSA : enUS;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{isArabic ? 'جاري التحميل...' : 'Loading...'}</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Badge variant="outline" className="text-gray-500">
        {isArabic ? 'لا يوجد اشتراك' : 'No subscription'}
      </Badge>
    );
  }

  const statusInfo = SUBSCRIPTION_STATUS_INFO[subscription.status];
  const statusLabel = isArabic ? statusInfo.labelAr : statusInfo.label;

  const getStatusIcon = () => {
    switch (subscription.status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'past_due':
        return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      case 'pending_payment':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (statusInfo.color) {
      case 'green':
        return 'default';
      case 'yellow':
        return 'secondary';
      case 'red':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const content = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={getStatusVariant()} className="gap-1">
          {getStatusIcon()}
          {statusLabel}
        </Badge>

        {subscription.plan === 'trial' && trialDaysRemaining > 0 && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {isArabic
              ? `${trialDaysRemaining} يوم متبقي`
              : `${trialDaysRemaining} days left`}
          </Badge>
        )}
      </div>

      {subscription.currentPeriodEnd && subscription.plan === 'monthly' && (
        <p className="text-sm text-muted-foreground">
          {isArabic ? 'ينتهي في: ' : 'Renews: '}
          {format(subscription.currentPeriodEnd.toDate(), 'PPP', { locale: dateLocale })}
        </p>
      )}

      {subscription.trialEndsAt && subscription.plan === 'trial' && (
        <p className="text-sm text-muted-foreground">
          {isArabic ? 'ينتهي في: ' : 'Trial ends: '}
          {format(subscription.trialEndsAt.toDate(), 'PPP', { locale: dateLocale })}
        </p>
      )}

      {statusCheck?.message && !showCard && (
        <p className="text-sm text-muted-foreground">{statusCheck.message}</p>
      )}
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {isArabic ? 'حالة الاشتراك' : 'Subscription Status'}
        </CardTitle>
        <CardDescription>
          {subscription.plan === 'trial'
            ? isArabic
              ? 'الفترة التجريبية'
              : 'Trial Period'
            : isArabic
            ? 'الاشتراك الشهري'
            : 'Monthly Subscription'}
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
