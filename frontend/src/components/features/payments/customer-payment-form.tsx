'use client';

// T045 [P] [US3] Customer payment form component
// Allows staff to record payments received from customers

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2, Upload, X } from 'lucide-react';
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
import { PaymentMethod, CreateCustomerPaymentInput } from '@/types/models/payment';
import { Account } from '@/types/models/account';
import { CurrencyCode } from '@/types/models/tenant';

// Validation schema
const customerPaymentSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().min(1),
  invoiceId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['cash', 'bank'] as const),
  accountId: z.string().min(1, 'Payment account is required'),
  accountName: z.string().min(1),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerPaymentFormData = z.infer<typeof customerPaymentSchema>;

interface CustomerPaymentFormProps {
  customerId: string;
  customerName: string;
  invoiceId?: string;
  maxAmount?: number;
  currency: CurrencyCode;
  accounts: Account[];
  onSubmit: (data: CreateCustomerPaymentInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CustomerPaymentForm({
  customerId,
  customerName,
  invoiceId,
  maxAmount,
  currency,
  accounts,
  onSubmit,
  onCancel,
  isLoading = false,
}: CustomerPaymentFormProps) {
  const t = useTranslations();
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; type: string; size: number }>>([]);

  // Filter accounts to only cash and bank
  const paymentAccounts = accounts.filter(
    (acc) => acc.subtype === 'cash' || acc.subtype === 'bank'
  );

  const form = useForm<CustomerPaymentFormData>({
    resolver: zodResolver(customerPaymentSchema),
    defaultValues: {
      customerId,
      customerName,
      invoiceId: invoiceId || '',
      amount: maxAmount || 0,
      method: 'cash',
      accountId: paymentAccounts.find((acc) => acc.subtype === 'cash')?.id || '',
      accountName: '',
      transactionReference: '',
      notes: '',
    },
  });

  // Update account name when account ID changes
  useEffect(() => {
    const accountId = form.watch('accountId');
    const account = paymentAccounts.find((acc) => acc.id === accountId);
    if (account) {
      form.setValue('accountName', account.name);
    }
  }, [form.watch('accountId')]);

  const handleSubmit = async (data: CustomerPaymentFormData) => {
    const paymentData: CreateCustomerPaymentInput = {
      paymentType: 'customer_receipt',
      customerId: data.customerId,
      customerName: data.customerName,
      invoiceId: data.invoiceId || undefined,
      amount: data.amount,
      currency,
      method: data.method as PaymentMethod,
      accountId: data.accountId,
      accountName: data.accountName,
      transactionReference: data.transactionReference || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      notes: data.notes || undefined,
    };

    await onSubmit(paymentData);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // In a real implementation, upload to Firebase Storage
    // For now, simulate upload
    const file = files[0];
    const attachment = {
      name: file.name,
      url: URL.createObjectURL(file), // Temporary URL
      type: file.type,
      size: file.size,
    };

    setAttachments([...attachments, attachment]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('payments.recordCustomerPayment')}</CardTitle>
        <CardDescription>
          {t('payments.recordPaymentReceived')} {customerName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payments.customer')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />

              {invoiceId && (
                <FormField
                  control={form.control}
                  name="invoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('payments.invoice')}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.amount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={maxAmount}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  {maxAmount && (
                    <FormDescription>
                      {t('payments.maxAmount')}: {maxAmount.toFixed(2)} {currency}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.method')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('payments.selectMethod')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">{t('payments.methods.cash')}</SelectItem>
                      <SelectItem value="bank">{t('payments.methods.bank')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.account')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('payments.selectAccount')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transaction Reference */}
            {form.watch('method') === 'bank' && (
              <FormField
                control={form.control}
                name="transactionReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payments.transactionReference')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('payments.transactionReferencePlaceholder')} />
                    </FormControl>
                    <FormDescription>{t('payments.transactionReferenceHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Attachments */}
            <div className="space-y-2">
              <FormLabel>{t('payments.attachments')}</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="payment-attachment"
                  accept="image/*,.pdf"
                />
                <label htmlFor="payment-attachment">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('payments.uploadReceipt')}
                    </span>
                  </Button>
                </label>
              </div>
              {attachments.length > 0 && (
                <ul className="space-y-2 mt-2">
                  {attachments.map((attachment, index) => (
                    <li key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm truncate">{attachment.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.notes')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder={t('payments.notesPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('payments.recordPayment')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
