'use client';

/**
 * Delete Expense Dialog Component
 * Dialog for confirming expense deletion with reason input
 * Creates a reversal journal entry for accounting integrity
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import type { Expense } from '@/types/models/expense';

interface DeleteExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  locale?: 'ar' | 'en';
}

export function DeleteExpenseDialog({
  expense,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  locale = 'ar',
}: DeleteExpenseDialogProps) {
  const t = useTranslations();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(t('expenses.deleteReasonRequired'));
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when dialog closes
      setReason('');
      setError('');
    }
    onOpenChange(newOpen);
  };

  // Format amount for display
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SD' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (!expense) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('expenses.deleteExpense')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>{t('expenses.deleteExpenseDescription')}</p>

              {/* Expense Details */}
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('expenses.expenseNumber')}:</span>
                  <span className="font-medium">{expense.expenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('expenses.description')}:</span>
                  <span className="font-medium">{expense.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('expenses.amount')}:</span>
                  <span className="font-medium">{formatAmount(expense.amount)} {expense.currency}</span>
                </div>
              </div>

              {/* Journal Entry Warning */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>{t('common.note')}:</strong> {t('expenses.deleteJournalEntryInfo')}
                </p>
              </div>

              {/* Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="delete-reason" className="text-foreground">
                  {t('expenses.deleteReason')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="delete-reason"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={t('expenses.deleteReasonPlaceholder')}
                  className={error ? 'border-destructive' : ''}
                  rows={3}
                  disabled={isLoading}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? t('common.deleting') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
