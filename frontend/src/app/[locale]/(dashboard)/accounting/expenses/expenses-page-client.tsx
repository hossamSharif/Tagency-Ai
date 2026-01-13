'use client';

/**
 * Expenses Page Client Component
 * T075 [US8] Client-side logic for expenses page
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExpenseList } from '@/components/features/expenses/expense-list';
import { ExpenseForm } from '@/components/features/expenses/expense-form';
import { createExpense, deleteExpense, updateExpense } from '@/app/actions/expenses';
import type { Expense, CreateExpenseInput } from '@/types/models/expense';
import type { Account } from '@/types/models/account';

interface ExpensesPageClientProps {
  initialExpenses: Expense[];
  paymentAccounts: Account[];
  expenseAccounts: Account[];
  currency?: string;
  locale?: 'ar' | 'en';
}

export function ExpensesPageClient({
  initialExpenses,
  paymentAccounts,
  expenseAccounts,
  currency = 'SAR',
  locale = 'ar',
}: ExpensesPageClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const handleCreateExpense = async (data: CreateExpenseInput) => {
    startTransition(async () => {
      try {
        const result = await createExpense(data);

        if (result.success) {
          toast.success(t('expenses.expenseRecorded'));
          setShowCreateDialog(false);
          router.refresh();
        } else {
          toast.error(result.error || t('expenses.failedToRecordExpense'));
        }
      } catch (error) {
        console.error('Error creating expense:', error);
        toast.error(t('expenses.failedToRecordExpense'));
      }
    });
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteExpense(expenseToDelete.id);

        if (result.success) {
          toast.success(t('expenses.expenseDeleted'));
          setExpenseToDelete(null);
          router.refresh();
        } else {
          toast.error(result.error || t('expenses.failedToDeleteExpense'));
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast.error(t('expenses.failedToDeleteExpense'));
      }
    });
  };

  const handleViewExpense = (expense: Expense) => {
    // Navigate to expense detail page (if we create one later)
    // For now, just log it
    console.log('View expense:', expense);
  };

  const handleEditExpense = (expense: Expense) => {
    // Navigate to expense edit page (if we create one later)
    // For now, just log it
    console.log('Edit expense:', expense);
    toast.info(t('expenses.editNotImplemented'));
  };

  const handleExport = () => {
    // Implement CSV export
    toast.info(t('expenses.exportNotImplemented'));
  };

  return (
    <>
      <ExpenseList
        expenses={expenses}
        accounts={[...paymentAccounts, ...expenseAccounts]}
        locale={locale}
        onCreate={() => setShowCreateDialog(true)}
        onEdit={handleEditExpense}
        onDelete={(expense) => setExpenseToDelete(expense)}
        onView={handleViewExpense}
        onExport={handleExport}
        isLoading={isPending}
      />

      {/* Create Expense Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('expenses.recordExpense')}</DialogTitle>
            <DialogDescription>{t('expenses.recordExpenseDescription')}</DialogDescription>
          </DialogHeader>
          <ExpenseForm
            currency={currency as any}
            paymentAccounts={paymentAccounts}
            expenseAccounts={expenseAccounts}
            onSubmit={handleCreateExpense}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('expenses.deleteExpense')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('expenses.deleteExpenseConfirmation')}
              <br />
              <br />
              <span className="font-semibold">
                {expenseToDelete?.expenseNumber}: {expenseToDelete?.description}
              </span>
              <br />
              <span className="text-sm text-muted-foreground">
                {t('expenses.deleteWarning')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExpense}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
