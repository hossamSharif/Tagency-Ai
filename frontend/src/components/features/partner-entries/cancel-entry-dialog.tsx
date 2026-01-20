'use client';

/**
 * Cancel Entry Dialog Component
 *
 * Confirmation dialog for canceling partner entries with reason input
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { PartnerEntry } from '@/app/actions/partner-entries';

interface CancelEntryDialogProps {
  entry: PartnerEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (entryId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
  locale: string;
}

export function CancelEntryDialog({
  entry,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  locale,
}: CancelEntryDialogProps) {
  const t = useTranslations('partnerEntries');
  const tCommon = useTranslations('common');
  const isArabic = locale === 'ar';

  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      setError('');
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError(isArabic ? 'يرجى إدخال سبب الإلغاء' : 'Please enter a cancellation reason');
      return;
    }

    if (!entry) return;

    setError('');
    await onConfirm(entry.id, reason.trim());
    setReason('');
  };

  if (!entry) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('cancelConfirmTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-start">
            {t('cancelConfirmMessage')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          {/* Entry details */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isArabic ? 'رقم القيد' : 'Entry Number'}:
              </span>
              <span className="font-medium">{entry.entryNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isArabic ? 'المبلغ' : 'Amount'}:
              </span>
              <span className="font-medium">
                {entry.type === 'credit' ? '+' : '-'}
                {new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-SA').format(entry.amount)} SAR
              </span>
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-2">
            <Label htmlFor="cancel-reason" className="text-sm font-medium">
              {t('cancelReason')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={isArabic ? 'أدخل سبب الإلغاء...' : 'Enter cancellation reason...'}
              className="resize-none"
              rows={3}
              disabled={isLoading}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading} onClick={handleClose}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isLoading || !reason.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                {isArabic ? 'جاري الإلغاء...' : 'Cancelling...'}
              </>
            ) : (
              t('cancelEntry')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default CancelEntryDialog;
