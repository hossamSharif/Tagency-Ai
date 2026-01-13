'use client';

import { Account, AccountType } from '@/types/models/account';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale, useTranslations } from 'next-intl';
import { Edit2, Eye, Lock } from 'lucide-react';

interface AccountListProps {
  accounts: Account[];
  onEdit?: (account: Account) => void;
  onView?: (account: Account) => void;
}

function formatCurrency(amount: number, locale: string = 'en'): string {
  // Always use 'en-US' locale for English numerals
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function getAccountTypeColor(type: AccountType): string {
  switch (type) {
    case 'asset':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'liability':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'income':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'expense':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function AccountList({ accounts, onEdit, onView }: AccountListProps) {
  const t = useTranslations();
  const locale = useLocale();

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  // Sort each group by code
  Object.keys(groupedAccounts).forEach((type) => {
    groupedAccounts[type as AccountType].sort((a, b) => a.code.localeCompare(b.code));
  });

  const accountTypes: AccountType[] = ['asset', 'liability', 'income', 'expense'];

  return (
    <div className="space-y-6">
      {accountTypes.map((type) => {
        const typeAccounts = groupedAccounts[type] || [];
        if (typeAccounts.length === 0) return null;

        const totalBalance = typeAccounts.reduce((sum, acc) => sum + acc.balance, 0);

        return (
          <Card key={type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getAccountTypeColor(type)}>
                      {t(`accounting.accountTypes.${type}`)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({typeAccounts.length} {t('accounting.accounts')})
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('accounting.totalBalance')}: {formatCurrency(totalBalance, locale)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">{t('accounting.code')}</TableHead>
                    <TableHead>{t('accounting.accountName')}</TableHead>
                    <TableHead>{t('accounting.subtype')}</TableHead>
                    <TableHead className="text-right">{t('accounting.balance')}</TableHead>
                    <TableHead className="w-20">{t('common.status')}</TableHead>
                    <TableHead className="w-32 text-right">{t('common.actions.label')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono font-medium">{account.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {locale === 'ar' ? account.nameAr : account.name}
                          </div>
                          {account.linkedEntityType && (
                            <div className="text-xs text-muted-foreground">
                              {t(`accounting.linkedTo.${account.linkedEntityType}`)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {t(`accounting.subtypes.${account.subtype}`)}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-mono ${
                        account.balance > 0
                          ? 'text-green-600 dark:text-green-400'
                          : account.balance < 0
                          ? 'text-red-600 dark:text-red-400'
                          : ''
                      }`}>
                        {formatCurrency(Math.abs(account.balance), locale)}
                        {account.balance < 0 && ' DR'}
                      </TableCell>
                      <TableCell>
                        {account.isActive ? (
                          <Badge variant="outline" className="text-green-600">
                            {t('common.active')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            {t('common.inactive')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(account)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(account)}
                              disabled={account.isSystem}
                            >
                              {account.isSystem ? (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Edit2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {accounts.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">{t('accounting.noAccounts')}</p>
              <p className="text-sm">{t('accounting.noAccountsDescription')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
