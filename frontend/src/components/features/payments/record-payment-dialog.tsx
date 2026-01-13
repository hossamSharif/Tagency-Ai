'use client';

/**
 * Record Payment Dialog
 * Dialog for recording customer payments against invoices
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomerPaymentForm } from './customer-payment-form';
import { useToast } from '@/hooks/use-toast';
import { Account } from '@/types/models/account';
import { CurrencyCode } from '@/types/models/tenant';
import { CreateCustomerPaymentInput } from '@/types/models/payment';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  customerId: string;
  customerName: string;
  maxAmount: number;
  currency: CurrencyCode;
  accounts: Account[];
  onSubmit: (data: CreateCustomerPaymentInput) => Promise<void>;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  customerId,
  customerName,
  maxAmount,
  currency,
  accounts,
  onSubmit,
}: RecordPaymentDialogProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: CreateCustomerPaymentInput) {
    try {
      setIsLoading(true);
      await onSubmit(data);

      toast({
        title: t('payments.success'),
        description: t('payments.paymentRecordedSuccess'),
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('payments.paymentRecordedError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('payments.recordPayment')}</DialogTitle>
          <DialogDescription>
            {t('payments.recordPaymentDescription', { customerName })}
          </DialogDescription>
        </DialogHeader>

        <CustomerPaymentForm
          customerId={customerId}
          customerName={customerName}
          invoiceId={invoiceId}
          maxAmount={maxAmount}
          currency={currency}
          accounts={accounts}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
