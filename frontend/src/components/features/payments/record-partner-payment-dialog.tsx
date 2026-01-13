'use client';

/**
 * Record Partner Payment Dialog
 * Dialog for recording payments to partners with commission deduction
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
import { PartnerPaymentForm } from './partner-payment-form';
import { useToast } from '@/hooks/use-toast';
import { Account } from '@/types/models/account';
import { CurrencyCode } from '@/types/models/tenant';
import { CreatePartnerPaymentInput } from '@/types/models/payment';

interface RecordPartnerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerName: string;
  defaultGrossAmount?: number;
  defaultCommissionPercentage?: number;
  invoiceIds?: string[];
  invoiceNumber?: string; // For display in single-invoice mode
  currency: CurrencyCode;
  accounts: Account[];
  onSubmit: (data: CreatePartnerPaymentInput) => Promise<void>;
  mode?: 'invoice-based' | 'manual' | 'single-invoice';
  locale?: string;
}

export function RecordPartnerPaymentDialog({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  defaultGrossAmount,
  defaultCommissionPercentage,
  invoiceIds,
  invoiceNumber,
  currency,
  accounts,
  onSubmit,
  mode = 'invoice-based',
  locale = 'en',
}: RecordPartnerPaymentDialogProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: CreatePartnerPaymentInput) {
    try {
      setIsLoading(true);
      await onSubmit(data);

      toast({
        title: t('payments.success'),
        description: t('payments.partnerPaymentRecordedSuccess'),
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error recording partner payment:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('payments.partnerPaymentRecordedError'),
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
          <DialogTitle>{t('payments.recordPartnerPayment')}</DialogTitle>
          <DialogDescription>
            {t('payments.recordPaymentToPartner')} {partnerName}
          </DialogDescription>
        </DialogHeader>

        <PartnerPaymentForm
          partnerId={partnerId}
          partnerName={partnerName}
          invoiceIds={invoiceIds}
          invoiceNumber={invoiceNumber}
          defaultGrossAmount={defaultGrossAmount}
          defaultCommissionPercentage={defaultCommissionPercentage}
          currency={currency}
          accounts={accounts}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
          mode={mode}
          locale={locale}
        />
      </DialogContent>
    </Dialog>
  );
}
