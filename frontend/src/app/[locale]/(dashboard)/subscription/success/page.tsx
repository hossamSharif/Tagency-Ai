/**
 * Subscription Success Page
 *
 * T207: Page displayed after successful subscription checkout.
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface SuccessPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SuccessPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'تم الاشتراك بنجاح' : 'Subscription Successful',
  };
}

export default async function SubscriptionSuccessPage({ params }: SuccessPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">
            {isArabic ? 'تم الاشتراك بنجاح!' : 'Subscription Successful!'}
          </CardTitle>
          <CardDescription className="text-base">
            {isArabic
              ? 'شكراً لاشتراكك. تم تفعيل حسابك بالكامل.'
              : 'Thank you for subscribing. Your account is now fully activated.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">
                {isArabic ? 'ما يمكنك فعله الآن:' : 'What you can do now:'}
              </span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>{isArabic ? 'إنشاء باقات سفر غير محدودة' : 'Create unlimited travel packages'}</li>
              <li>{isArabic ? 'إدارة العملاء والحجوزات' : 'Manage customers and bookings'}</li>
              <li>{isArabic ? 'إنشاء الفواتير وتتبع المدفوعات' : 'Generate invoices and track payments'}</li>
              <li>{isArabic ? 'إدارة عمولات الشركاء' : 'Manage partner commissions'}</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="gap-2">
              <Link href={`/${locale}`}>
                {isArabic ? 'الذهاب للوحة التحكم' : 'Go to Dashboard'}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/settings/subscription`}>
                {isArabic ? 'إدارة الاشتراك' : 'Manage Subscription'}
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {isArabic
              ? 'ستصلك رسالة تأكيد على بريدك الإلكتروني قريباً.'
              : 'A confirmation email will be sent to you shortly.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
