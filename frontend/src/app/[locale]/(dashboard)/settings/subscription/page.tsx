/**
 * Subscription Management Page
 *
 * T206: Page for managing subscription settings.
 */

import { requireRole } from '@/lib/auth/require-role';
import { SubscriptionManager } from './subscription-manager';

interface SubscriptionPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ method?: string }>;
}

export async function generateMetadata({ params }: SubscriptionPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'إدارة الاشتراك' : 'Subscription Management',
  };
}

export default async function SubscriptionPage({ params, searchParams }: SubscriptionPageProps) {
  const { locale } = await params;
  const { method } = await searchParams;
  const isArabic = locale === 'ar';

  // Only owner can manage subscription
  await requireRole('owner', locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isArabic ? 'إدارة الاشتراك' : 'Subscription Management'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? 'إدارة خطة اشتراكك والفوترة'
            : 'Manage your subscription plan and billing'}
        </p>
      </div>

      {/* Subscription Manager */}
      <SubscriptionManager locale={locale} initialMethod={method} />
    </div>
  );
}
