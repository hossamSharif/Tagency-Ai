'use client';

/**
 * Expense Card Component
 * T074 [P] [US8] Create expense-card component
 * Displays individual expense information in a card format
 */

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText,
  Tag,
  Banknote,
  Building2,
  User,
  Paperclip,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Expense, ExpenseCategory } from '@/types/models/expense';
import { Timestamp } from 'firebase/firestore';

interface ExpenseCardProps {
  expense: Expense;
  locale?: 'ar' | 'en';
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  showDetails?: boolean;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent: 'bg-purple-100 text-purple-700',
  utilities: 'bg-blue-100 text-blue-700',
  supplies: 'bg-green-100 text-green-700',
  travel: 'bg-orange-100 text-orange-700',
  marketing: 'bg-pink-100 text-pink-700',
  salary: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700',
};

const METHOD_ICONS = {
  cash: <Banknote className="h-4 w-4" />,
  bank: <Building2 className="h-4 w-4" />,
};

export function ExpenseCard({
  expense,
  locale = 'ar',
  onEdit,
  onDelete,
  onClick,
  showDetails = true,
}: ExpenseCardProps) {
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const formatDate = (timestamp: Timestamp | string) => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMM yyyy', { locale: dateLocale });
  };

  const formatCurrency = (amount: number) => {
    // Always use 'en-US' locale for English numerals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: expense.currency,
    }).format(amount);
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-full bg-red-100 text-red-600">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-mono">
                {expense.expenseNumber}
              </CardTitle>
              <Badge
                variant="secondary"
                className={CATEGORY_COLORS[expense.category]}
              >
                {t(`categories.${expense.category}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {expense.description}
            </p>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  {tCommon('edit')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {tCommon('delete')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent>
        {showDetails && (
          <div className="space-y-3">
            {/* Amount */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{t('amount')}</span>
              <span className="text-lg font-bold">{formatCurrency(expense.amount)}</span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {/* Date */}
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('expenseDate')}</p>
                  <p className="font-medium">{formatDate(expense.expenseDate)}</p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-start gap-2">
                {METHOD_ICONS[expense.paymentMethod]}
                <div>
                  <p className="text-xs text-muted-foreground">{t('paymentMethod')}</p>
                  <p className="font-medium">{t(`methods.${expense.paymentMethod}`)}</p>
                </div>
              </div>

              {/* Payment Account */}
              <div className="flex items-start gap-2 col-span-2">
                <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('paymentAccount')}</p>
                  <p className="font-medium truncate">{expense.accountName}</p>
                </div>
              </div>

              {/* Expense Account */}
              <div className="flex items-start gap-2 col-span-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('expenseAccount')}</p>
                  <p className="font-medium truncate">{expense.expenseAccountName}</p>
                </div>
              </div>

              {/* Vendor Name */}
              {expense.vendorName && (
                <div className="flex items-start gap-2 col-span-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('vendorName')}</p>
                    <p className="font-medium">{expense.vendorName}</p>
                    {expense.vendorInvoiceNumber && (
                      <p className="text-xs text-muted-foreground">
                        {t('invoice')}: {expense.vendorInvoiceNumber}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {expense.attachments && expense.attachments.length > 0 && (
                <div className="flex items-start gap-2 col-span-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('attachments')}</p>
                    <p className="font-medium">
                      {expense.attachments.length} {t('files')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {expense.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">{t('notes')}</p>
                <p className="text-sm">{expense.notes}</p>
              </div>
            )}

            {/* Journal Entry Link */}
            {expense.journalEntryId && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>
                  {t('journalEntry')}: {expense.journalEntryId.substring(0, 8)}...
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
