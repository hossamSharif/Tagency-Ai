'use client';

/**
 * Payment Method Selector Component
 *
 * T203: Component for selecting payment method (Stripe or Bank Transfer).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PRICING, BANK_TRANSFER_DETAILS } from '@/lib/stripe/config';
import { createSubscriptionCheckoutAction, initiateBankTransferAction } from '@/app/actions/subscriptions';
import { CreditCard, Building2, Loader2, ArrowRight, CheckCircle2, Shield } from 'lucide-react';

interface PaymentMethodSelectorProps {
  locale?: 'ar' | 'en';
  onBankTransferInitiated?: (paymentId: string) => void;
}

type PaymentMethod = 'card' | 'bank';

export function PaymentMethodSelector({
  locale = 'en',
  onBankTransferInitiated,
}: PaymentMethodSelectorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isArabic = locale === 'ar';

  const monthlyPrice = PRICING.monthlyPriceAmount / 100;

  const handleContinue = async () => {
    setIsSubmitting(true);

    try {
      if (method === 'card') {
        // Stripe checkout
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
      } else {
        // Bank transfer
        const result = await initiateBankTransferAction(isArabic ? 'ar' : 'en');

        if (!result.success) {
          toast({
            title: isArabic ? 'خطأ' : 'Error',
            description: result.error,
            variant: 'destructive',
          });
          return;
        }
        toast({
          title: isArabic ? 'تم بدء التحويل' : 'Transfer Initiated',
          description: isArabic
            ? 'يرجى إتمام التحويل ورفع إثبات الدفع'
            : 'Please complete the transfer and upload payment proof',
        });

        if (onBankTransferInitiated) {
          onBankTransferInitiated(result.data.paymentId);
        }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isArabic ? 'اختر طريقة الدفع' : 'Choose Payment Method'}</CardTitle>
        <CardDescription>
          {isArabic
            ? `الاشتراك الشهري: $${monthlyPrice}/شهر`
            : `Monthly subscription: $${monthlyPrice}/month`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={method}
          onValueChange={(value) => setMethod(value as PaymentMethod)}
          className="space-y-4"
        >
          {/* Card Payment Option */}
          <div
            className={`flex items-start space-x-4 rtl:space-x-reverse p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              method === 'card'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setMethod('card')}
          >
            <RadioGroupItem value="card" id="card" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="card" className="text-base font-medium cursor-pointer flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {isArabic ? 'البطاقة الائتمانية' : 'Credit/Debit Card'}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {isArabic
                  ? 'الدفع الفوري عبر Stripe - Visa، Mastercard، وغيرها'
                  : 'Instant payment via Stripe - Visa, Mastercard, and more'}
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-green-600" />
                {isArabic ? 'دفع آمن ومشفر' : 'Secure & encrypted'}
              </div>
            </div>
          </div>

          {/* Bank Transfer Option */}
          <div
            className={`flex items-start space-x-4 rtl:space-x-reverse p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              method === 'bank'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setMethod('bank')}
          >
            <RadioGroupItem value="bank" id="bank" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="bank" className="text-base font-medium cursor-pointer flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {isArabic ? 'التحويل البنكي' : 'Bank Transfer'}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {isArabic
                  ? 'قم بالتحويل البنكي وارفع إثبات الدفع'
                  : 'Make a bank transfer and upload payment proof'}
              </p>
              <p className="text-sm text-amber-600 mt-2">
                {isArabic
                  ? 'قد يستغرق التفعيل 1-2 يوم عمل'
                  : 'Activation may take 1-2 business days'}
              </p>
            </div>
          </div>
        </RadioGroup>

        {/* Features List */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">{isArabic ? 'ما ستحصل عليه:' : "What you'll get:"}</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {isArabic ? 'باقات سفر غير محدودة' : 'Unlimited travel packages'}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {isArabic ? 'إدارة العملاء مع OCR' : 'Customer management with OCR'}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {isArabic ? 'الفواتير والمدفوعات' : 'Invoicing & payments'}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {isArabic ? 'إدارة عمولات الشركاء' : 'Partner commission management'}
            </li>
          </ul>
        </div>

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleContinue}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isArabic ? 'جاري المعالجة...' : 'Processing...'}
            </>
          ) : (
            <>
              {isArabic ? 'المتابعة' : 'Continue'}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
