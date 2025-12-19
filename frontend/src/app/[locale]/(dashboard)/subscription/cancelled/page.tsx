/**
 * Subscription Cancelled Page
 *
 * T208: Page displayed when user cancels checkout.
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, HelpCircle, MessageCircle } from 'lucide-react';

interface CancelledPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CancelledPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'تم إلغاء الاشتراك' : 'Checkout Cancelled',
  };
}

export default async function SubscriptionCancelledPage({ params }: CancelledPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-gray-500" />
          </div>
          <CardTitle className="text-2xl">
            {isArabic ? 'تم إلغاء عملية الدفع' : 'Checkout Cancelled'}
          </CardTitle>
          <CardDescription className="text-base">
            {isArabic
              ? 'لم يتم إكمال عملية الاشتراك. لم يتم خصم أي مبلغ.'
              : "Your subscription wasn't completed. No charges were made."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg text-start">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {isArabic ? 'هل تحتاج مساعدة؟' : 'Need help?'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? 'إذا واجهت مشكلة أثناء عملية الدفع أو لديك أسئلة حول الاشتراك، فلا تتردد في التواصل معنا.'
                : 'If you encountered an issue during checkout or have questions about the subscription, feel free to reach out.'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="gap-2">
              <Link href={`/${locale}/settings/subscription`}>
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {isArabic ? 'المحاولة مرة أخرى' : 'Try Again'}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}`}>
                {isArabic ? 'العودة للوحة التحكم' : 'Return to Dashboard'}
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              {isArabic ? 'تذكر:' : 'Remember:'}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {isArabic
                  ? 'يمكنك الاستمرار في استخدام الفترة التجريبية'
                  : 'You can continue using your trial period'}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {isArabic
                  ? 'يمكنك الاشتراك في أي وقت'
                  : 'You can subscribe at any time'}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                {isArabic
                  ? 'التحويل البنكي متاح كبديل'
                  : 'Bank transfer is available as an alternative'}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
