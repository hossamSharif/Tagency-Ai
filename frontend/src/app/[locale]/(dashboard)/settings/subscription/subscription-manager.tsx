'use client';

/**
 * Subscription Manager Component
 *
 * Client component for subscription management page.
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/hooks/use-subscription';
import {
  SubscriptionCard,
  PaymentMethodSelector,
  BankTransferInstructions,
  SubscriptionPaymentHistory,
} from '@/components/features/subscriptions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { initiateBankTransferAction } from '@/app/actions/subscriptions';
import { CreditCard, Receipt, Building2 } from 'lucide-react';

interface SubscriptionManagerProps {
  locale: string;
  initialMethod?: string;
}

type ViewState = 'overview' | 'select-method' | 'bank-transfer';

export function SubscriptionManager({ locale, initialMethod }: SubscriptionManagerProps) {
  const { subscription, loading } = useSubscription();
  const isArabic = locale === 'ar';

  const [view, setView] = useState<ViewState>('overview');
  const [bankTransferData, setBankTransferData] = useState<{
    paymentId: string;
    reference: string;
  } | null>(null);

  // If initialMethod is bank, start bank transfer flow
  useEffect(() => {
    if (initialMethod === 'bank' && !subscription?.pendingBankTransfer) {
      setView('select-method');
    }
  }, [initialMethod, subscription?.pendingBankTransfer]);

  // If there's a pending bank transfer, show bank transfer view
  useEffect(() => {
    if (subscription?.pendingBankTransfer) {
      setBankTransferData({
        paymentId: subscription.pendingBankTransfer.paymentId,
        reference: `SUB-${subscription.tenantId.substring(0, 8).toUpperCase()}`,
      });
      setView('bank-transfer');
    }
  }, [subscription?.pendingBankTransfer, subscription?.tenantId]);

  const handleSelectPayment = () => {
    setView('select-method');
  };

  const handleBankTransferInitiated = async (paymentId: string) => {
    setBankTransferData({
      paymentId,
      reference: `SUB-${subscription?.tenantId?.substring(0, 8).toUpperCase() || 'UNKNOWN'}`,
    });
    setView('bank-transfer');
  };

  const handleProofUploaded = () => {
    // Stay on bank transfer view but show a success message
    // The subscription status will update to pending_payment
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If need to show bank transfer instructions
  if (view === 'bank-transfer' && bankTransferData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <BankTransferInstructions
          locale={isArabic ? 'ar' : 'en'}
          paymentId={bankTransferData.paymentId}
          reference={bankTransferData.reference}
          onProofUploaded={handleProofUploaded}
        />
        <button
          onClick={() => setView('overview')}
          className="text-sm text-muted-foreground hover:underline"
        >
          {isArabic ? 'العودة إلى نظرة عامة' : 'Back to overview'}
        </button>
      </div>
    );
  }

  // If need to show payment method selection
  if (view === 'select-method') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PaymentMethodSelector
          locale={isArabic ? 'ar' : 'en'}
          onBankTransferInitiated={handleBankTransferInitiated}
        />
        <button
          onClick={() => setView('overview')}
          className="text-sm text-muted-foreground hover:underline"
        >
          {isArabic ? 'العودة إلى نظرة عامة' : 'Back to overview'}
        </button>
      </div>
    );
  }

  // Default overview with tabs
  return (
    <Tabs defaultValue="subscription" className="space-y-6">
      <TabsList>
        <TabsTrigger value="subscription" className="gap-2">
          <CreditCard className="h-4 w-4" />
          {isArabic ? 'الاشتراك' : 'Subscription'}
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-2">
          <Receipt className="h-4 w-4" />
          {isArabic ? 'سجل المدفوعات' : 'Payment History'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="subscription" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <SubscriptionCard locale={isArabic ? 'ar' : 'en'} />
        </div>
      </TabsContent>

      <TabsContent value="history">
        <SubscriptionPaymentHistory locale={isArabic ? 'ar' : 'en'} />
      </TabsContent>
    </Tabs>
  );
}
