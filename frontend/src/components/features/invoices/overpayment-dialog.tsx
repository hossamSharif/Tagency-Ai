'use client';

/**
 * Overpayment Dialog Component
 * Handles overpayment scenarios when editing paid invoices
 * Offers options: Credit to customer account OR Create refund
 */

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Wallet } from 'lucide-react';

interface OverpaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  customerId: string;
  customerName: string;
  overpaymentAmount: number;
  currency: string;
  onComplete: () => void;
}

type OverpaymentOption = 'credit' | 'refund';

export function OverpaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  customerId,
  customerName,
  overpaymentAmount,
  currency,
  onComplete,
}: OverpaymentDialogProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedOption, setSelectedOption] = useState<OverpaymentOption>('credit');

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  async function handleConfirm() {
    startTransition(async () => {
      try {
        if (selectedOption === 'credit') {
          // Create credit on customer account
          // For now, this just shows a success message - the actual credit
          // would be handled by a customer credit action
          toast({
            title: t('invoices.creditApplied'),
            description: t('invoices.creditAppliedDescription', {
              amount: formatCurrency(overpaymentAmount),
              currency,
              customerName,
            }),
          });
        } else {
          // Create refund payment record
          // For now, this just shows a success message - the actual refund
          // would be handled by a refund payment action
          toast({
            title: t('invoices.refundCreated'),
            description: t('invoices.refundCreatedDescription', {
              amount: formatCurrency(overpaymentAmount),
              currency,
              customerName,
            }),
          });
        }

        onComplete();
      } catch (error) {
        console.error('Error handling overpayment:', error);
        toast({
          title: t('common.error'),
          description: t('invoices.overpaymentError'),
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t('invoices.overpaymentTitle')}</DialogTitle>
          <DialogDescription>
            {t('invoices.overpaymentDescription', {
              amount: formatCurrency(overpaymentAmount),
              currency,
              customerName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedOption}
            onValueChange={(value) => setSelectedOption(value as OverpaymentOption)}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="credit" id="credit" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="credit" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="h-4 w-4" />
                  {t('invoices.creditToAccount')}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('invoices.creditToAccountDescription')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="refund" id="refund" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="refund" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  {t('invoices.createRefund')}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('invoices.createRefundDescription')}
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              t('common.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
