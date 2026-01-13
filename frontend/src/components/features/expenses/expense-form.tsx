'use client';

/**
 * Expense Form Component
 * T072 [P] [US8] Create expense-form component
 * Allows staff to record business expenses with categorization and documentation
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2, Upload, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Account } from '@/types/models/account';
import type { CurrencyCode } from '@/types/models/tenant';
import type { ExpenseCategory, PaymentMethod, CreateExpenseInput } from '@/types/models/expense';

// Validation schema
const expenseFormSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  category: z.enum(['rent', 'utilities', 'supplies', 'travel', 'marketing', 'salary', 'other']),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['cash', 'bank'] as const),
  accountId: z.string().min(1, 'Payment account is required'),
  accountName: z.string().min(1),
  expenseAccountId: z.string().min(1, 'Expense account is required'),
  expenseAccountName: z.string().min(1),
  expenseDate: z.date(),
  vendorName: z.string().max(100).optional(),
  vendorInvoiceNumber: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  currency: CurrencyCode;
  paymentAccounts: Account[]; // Cash and bank accounts
  expenseAccounts: Account[]; // Expense type accounts
  onSubmit: (data: CreateExpenseInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultValues?: Partial<ExpenseFormData>;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'rent',
  'utilities',
  'supplies',
  'travel',
  'marketing',
  'salary',
  'other',
];

export function ExpenseForm({
  currency,
  paymentAccounts,
  expenseAccounts,
  onSubmit,
  onCancel,
  isLoading = false,
  defaultValues,
}: ExpenseFormProps) {
  const t = useTranslations();
  const [attachments, setAttachments] = useState<
    Array<{ id: string; name: string; url: string; type: string; size: number; uploadedAt: Date }>
  >([]);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      category: 'other',
      amount: 0,
      paymentMethod: 'cash',
      accountId: paymentAccounts.find((acc) => acc.subtype === 'cash')?.id || '',
      accountName: '',
      expenseAccountId: expenseAccounts.find((acc) => acc.code === '5001')?.id || '',
      expenseAccountName: '',
      expenseDate: new Date(),
      vendorName: '',
      vendorInvoiceNumber: '',
      notes: '',
      ...defaultValues,
    },
  });

  // Update account name when account ID changes
  useEffect(() => {
    const accountId = form.watch('accountId');
    const account = paymentAccounts.find((acc) => acc.id === accountId);
    if (account) {
      form.setValue('accountName', account.name);
    }
  }, [form.watch('accountId'), paymentAccounts]);

  // Update expense account name when expense account ID changes
  useEffect(() => {
    const expenseAccountId = form.watch('expenseAccountId');
    const account = expenseAccounts.find((acc) => acc.id === expenseAccountId);
    if (account) {
      form.setValue('expenseAccountName', account.name);
    }
  }, [form.watch('expenseAccountId'), expenseAccounts]);

  const handleSubmit = async (data: ExpenseFormData) => {
    const expenseData: CreateExpenseInput = {
      description: data.description,
      category: data.category,
      amount: data.amount,
      currency,
      paymentMethod: data.paymentMethod as PaymentMethod,
      accountId: data.accountId,
      accountName: data.accountName,
      expenseAccountId: data.expenseAccountId,
      expenseAccountName: data.expenseAccountName,
      expenseDate: data.expenseDate,
      vendorName: data.vendorName || undefined,
      vendorInvoiceNumber: data.vendorInvoiceNumber || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      notes: data.notes || undefined,
      createdBy: '', // Will be set by server action
    };

    await onSubmit(expenseData);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // In a real implementation, upload to Firebase Storage
    // For now, simulate upload
    const file = files[0];

    // Validate file size (max 10MB)
    if (file.size > 10485760) {
      alert('File size must be less than 10MB');
      return;
    }

    const attachment = {
      id: `temp_${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file), // Temporary URL
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
    };

    setAttachments([...attachments, attachment]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((att) => att.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('expenses.recordExpense')}</CardTitle>
        <CardDescription>{t('expenses.recordExpenseDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('expenses.description')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('expenses.descriptionPlaceholder')}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('expenses.category')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('expenses.selectCategory')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {t(`expenses.categories.${category}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('expenses.amount')} ({currency})
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Expense Date */}
            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('expenses.expenseDate')}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value?.toISOString().split('T')[0] || ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method and Account */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">{t('expenses.paymentDetails')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('expenses.paymentMethod')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('expenses.selectMethod')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">{t('expenses.methods.cash')}</SelectItem>
                          <SelectItem value="bank">{t('expenses.methods.bank')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('expenses.paymentAccount')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('expenses.selectAccount')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('expenses.paymentAccountDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Expense Account */}
            <FormField
              control={form.control}
              name="expenseAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('expenses.expenseAccount')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('expenses.selectExpenseAccount')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('expenses.expenseAccountDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendor Information */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">{t('expenses.vendorInformation')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vendorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('expenses.vendorName')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('expenses.vendorNamePlaceholder')}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>{t('expenses.optional')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendorInvoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('expenses.vendorInvoiceNumber')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('expenses.vendorInvoicePlaceholder')}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>{t('expenses.optional')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-4">
              <FormLabel>{t('expenses.attachments')}</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('expenses.uploadReceipt')}
                    </span>
                  </Button>
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('expenses.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('expenses.notesPlaceholder')}
                      rows={3}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>{t('expenses.optional')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('expenses.recordExpense')}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  {t('common.cancel')}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
