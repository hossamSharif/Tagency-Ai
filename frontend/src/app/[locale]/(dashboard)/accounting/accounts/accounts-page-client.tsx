'use client';

import { useState, useTransition } from 'react';
import { Account } from '@/types/models/account';
import { AccountList } from '@/components/features/accounting/account-list';
import { AccountForm } from '@/components/features/accounting/account-form';
import { AccountInput } from '@/lib/validations/accounting';
import { createAccount, updateAccount, deleteAccount } from '@/app/actions/accounting';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AccountsPageClientProps {
  initialAccounts: Account[];
}

export function AccountsPageClient({ initialAccounts }: AccountsPageClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  async function handleCreate(data: AccountInput) {
    startTransition(async () => {
      const result = await createAccount(data);

      if (result.success) {
        toast.success(t('accounting.accountCreated'));
        setIsCreateDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || t('common.error'));
      }
    });
  }

  async function handleUpdate(data: AccountInput) {
    if (!selectedAccount) return;

    startTransition(async () => {
      const result = await updateAccount(selectedAccount.id, data);

      if (result.success) {
        toast.success(t('accounting.accountUpdated'));
        setIsEditDialogOpen(false);
        setSelectedAccount(null);
        router.refresh();
      } else {
        toast.error(result.error || t('common.error'));
      }
    });
  }

  async function handleDelete() {
    if (!selectedAccount) return;

    startTransition(async () => {
      const result = await deleteAccount(selectedAccount.id);

      if (result.success) {
        toast.success(t('accounting.accountDeleted'));
        setIsDeleteDialogOpen(false);
        setSelectedAccount(null);
        router.refresh();
      } else {
        toast.error(result.error || t('common.error'));
      }
    });
  }

  function handleEdit(account: Account) {
    setSelectedAccount(account);
    setIsEditDialogOpen(true);
  }

  function handleDeleteClick(account: Account) {
    setSelectedAccount(account);
    setIsDeleteDialogOpen(true);
  }

  return (
    <>
      {/* Create Account Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('accounting.createAccount')}
        </Button>
      </div>

      {/* Accounts List */}
      <AccountList
        accounts={accounts}
        onEdit={handleEdit}
        onView={(account) => {
          // Could navigate to account detail page if needed
          console.log('View account:', account);
        }}
      />

      {/* Create Account Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('accounting.createAccount')}</DialogTitle>
            <DialogDescription>
              {t('accounting.createAccountDescription')}
            </DialogDescription>
          </DialogHeader>
          <AccountForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('accounting.editAccount')}</DialogTitle>
            <DialogDescription>
              {t('accounting.editAccountDescription')}
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <AccountForm
              account={selectedAccount}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedAccount(null);
              }}
              isPending={isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('accounting.deleteAccount')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('accounting.deleteAccountConfirmation', {
                name: selectedAccount?.name || ''
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setSelectedAccount(null);
            }}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
