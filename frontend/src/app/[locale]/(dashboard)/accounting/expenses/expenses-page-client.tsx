'use client';

/**
 * Expenses Page Client Component
 * T075 [US8] Client-side logic for expenses page
 */

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExpenseList } from '@/components/features/expenses/expense-list';
import { ExpenseForm } from '@/components/features/expenses/expense-form';
import { DeleteExpenseDialog } from '@/components/features/expenses/delete-expense-dialog';
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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Handle URL query param to auto-open the create modal
  useEffect(() => {
    const openModal = searchParams.get('openModal');
    if (openModal === 'true') {
      setShowCreateDialog(true);
      // Clean up the URL by removing the query param
      const url = new URL(window.location.href);
      url.searchParams.delete('openModal');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [searchParams]);

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

  const handleDeleteExpense = async (reason: string) => {
    if (!expenseToDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteExpense(expenseToDelete.id, reason);

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

      {/* Delete Expense Dialog with Reason */}
      <DeleteExpenseDialog
        expense={expenseToDelete}
        open={!!expenseToDelete}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
        onConfirm={handleDeleteExpense}
        isLoading={isPending}
        locale={locale}
      />
    </>
  );
}
