'use client';

/**
 * Partner Transaction Modal Component
 *
 * Dialog modal for creating partner account entries (prepayments/withdrawals)
 * directly from the dashboard quick actions.
 */

import { useState, useTransition, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PartnerEntryForm } from '@/components/features/partner-entries/partner-entry-form';
import { createPartnerEntryAction, getPartnerBalanceAction } from '@/app/actions/partner-entries';
import type { CreatePartnerEntryInput } from '@/lib/validations/partner-entries';

interface CashBankAccount {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: 'cash' | 'bank';
}

interface PartnerTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  accounts: CashBankAccount[];
  locale: string;
  onSuccess?: () => void;
}

export function PartnerTransactionModal({
  open,
  onOpenChange,
  partners,
  accounts,
  locale,
  onSuccess,
}: PartnerTransactionModalProps) {
  const t = useTranslations('dashboard');
  const tPartnerEntries = useTranslations('partnerEntries');
  const [isPending, startTransition] = useTransition();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [partnerBalance, setPartnerBalance] = useState<number | null>(null);

  const isArabic = locale === 'ar';

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedPartnerId('');
      setPartnerBalance(null);
    }
  }, [open]);

  // Fetch partner balance when partner is selected
  useEffect(() => {
    if (selectedPartnerId) {
      getPartnerBalanceAction(selectedPartnerId).then((result) => {
        if (result.success && result.data) {
          setPartnerBalance(result.data.balance);
        }
      });
    } else {
      setPartnerBalance(null);
    }
  }, [selectedPartnerId]);

  const handleSubmit = async (data: CreatePartnerEntryInput) => {
    startTransition(async () => {
      try {
        const result = await createPartnerEntryAction({
          ...data,
          partnerId: selectedPartnerId,
        });

        if (result.success) {
          toast.success(tPartnerEntries('successCreated'));
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error || 'Failed to create entry');
        }
      } catch (error) {
        console.error('Error creating partner entry:', error);
        toast.error('Failed to create entry');
      }
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('quickActions.partnerTransaction.modalTitle')}</DialogTitle>
          <DialogDescription>
            {t('quickActions.partnerTransaction.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Partner Selector */}
          <div className="space-y-2">
            <Label htmlFor="partner-select">
              {t('quickActions.partnerTransaction.selectPartner')}
            </Label>
            <Select
              value={selectedPartnerId}
              onValueChange={setSelectedPartnerId}
            >
              <SelectTrigger id="partner-select">
                <SelectValue
                  placeholder={t('quickActions.partnerTransaction.selectPartner')}
                />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.code} - {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Show current balance when partner is selected */}
            {selectedPartnerId && partnerBalance !== null && (
              <div className="mt-2 p-3 rounded-md bg-muted">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {tPartnerEntries('currentBalance')}:
                  </span>
                  <span
                    className={
                      partnerBalance > 0
                        ? 'text-green-600 font-medium'
                        : partnerBalance < 0
                        ? 'text-orange-600 font-medium'
                        : 'font-medium'
                    }
                  >
                    {partnerBalance.toLocaleString(isArabic ? 'ar-SA' : 'en-SA')} SAR
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Partner Entry Form - only show when partner is selected */}
          {selectedPartnerId && (
            <PartnerEntryForm
              partnerId={selectedPartnerId}
              accounts={accounts}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isPending}
              locale={locale}
            />
          )}

          {/* Empty state when no partner selected */}
          {!selectedPartnerId && (
            <div className="py-8 text-center text-muted-foreground">
              {isArabic
                ? 'الرجاء اختيار شريك للمتابعة'
                : 'Please select a partner to continue'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PartnerTransactionModal;
