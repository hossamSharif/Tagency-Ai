'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/types/models/invoice';
import { Payment } from '@/types/models/payment';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';

interface CancelInvoiceDialogProps {
  invoice: Invoice;
  payments?: Payment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (invoiceId: string, version: number, reason: string) => Promise<{ success: boolean; message?: string }>;
}

export function CancelInvoiceDialog({
  invoice,
  payments = [],
  open,
  onOpenChange,
  onCancel,
}: CancelInvoiceDialogProps) {
  const t = useTranslations();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPayments = payments.length > 0 || invoice.paidAmount > 0;
  const totalPaid = invoice.paidAmount;

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError(t('invoices.cancelDialog.reasonRequired'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onCancel(invoice.id, invoice.version, reason);

      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.message || t('invoices.errors.cancelError'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invoices.errors.cancelError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('invoices.cancelDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('invoices.cancelDialog.description', {
              invoiceNumber: invoice.invoiceNumber,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasPayments && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('invoices.cancelDialog.hasPaymentsWarning', {
                  amount: totalPaid.toFixed(2),
                  currency: invoice.currency,
                })}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">
              {t('invoices.cancelDialog.reason')}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="cancellation-reason"
              placeholder={t('invoices.cancelDialog.reasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              t('invoices.cancelDialog.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
