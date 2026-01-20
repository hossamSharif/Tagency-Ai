'use client';

/**
 * Partner Entry Form Component
 *
 * Form for creating partner account entries (prepayments and withdrawals)
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
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
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  createPartnerEntrySchema,
  type CreatePartnerEntryInput,
} from '@/lib/validations/partner-entries';
import { ArrowUpCircle, ArrowDownCircle, Banknote, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CashBankAccount {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: 'cash' | 'bank';
}

interface PartnerEntryFormProps {
  partnerId: string;
  accounts: CashBankAccount[];
  onSubmit: (data: CreatePartnerEntryInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  locale: string;
}

export function PartnerEntryForm({
  partnerId,
  accounts,
  onSubmit,
  onCancel,
  isLoading,
  locale,
}: PartnerEntryFormProps) {
  const t = useTranslations('partnerEntries');
  const tCommon = useTranslations('common');
  const isArabic = locale === 'ar';

  // Find default cash account
  const defaultAccount = accounts.find((a) => a.type === 'cash') || accounts[0];

  const form = useForm<CreatePartnerEntryInput>({
    resolver: zodResolver(createPartnerEntrySchema),
    defaultValues: {
      partnerId,
      type: 'credit',
      amount: 0,
      method: 'cash',
      accountId: defaultAccount?.id || '',
      reference: '',
      notes: '',
    },
  });

  const watchType = form.watch('type');
  const watchMethod = form.watch('method');

  // Update account based on payment method
  const handleMethodChange = (method: 'cash' | 'bank') => {
    form.setValue('method', method);
    const matchingAccount = accounts.find((a) => a.type === method);
    if (matchingAccount) {
      form.setValue('accountId', matchingAccount.id);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    form.reset({
      partnerId,
      type: 'credit',
      amount: 0,
      method: 'cash',
      accountId: defaultAccount?.id || '',
      reference: '',
      notes: '',
    });
  });

  // Filter accounts based on selected method
  const filteredAccounts = accounts.filter((a) => a.type === watchMethod);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entry Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('entryType')}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Label
                    htmlFor="credit"
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                      field.value === 'credit'
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-muted hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value="credit" id="credit" />
                    <ArrowUpCircle className={cn(
                      'h-5 w-5',
                      field.value === 'credit' ? 'text-green-600' : 'text-muted-foreground'
                    )} />
                    <div>
                      <p className="font-medium">{t('credit')}</p>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'إضافة رصيد للشريك' : 'Add balance to partner'}
                      </p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="debit"
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                      field.value === 'debit'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                        : 'border-muted hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value="debit" id="debit" />
                    <ArrowDownCircle className={cn(
                      'h-5 w-5',
                      field.value === 'debit' ? 'text-orange-600' : 'text-muted-foreground'
                    )} />
                    <div>
                      <p className="font-medium">{t('debit')}</p>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'خصم من رصيد الشريك' : 'Deduct from partner'}
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('amount')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={cn(
                      'text-lg font-medium',
                      isArabic ? 'pe-16' : 'pe-16'
                    )}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                  <span className={cn(
                    'absolute top-1/2 -translate-y-1/2 text-muted-foreground',
                    isArabic ? 'left-3' : 'right-3'
                  )}>
                    SAR
                  </span>
                </div>
              </FormControl>
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
              <FormLabel>{t('paymentMethod')}</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={field.value === 'cash' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => handleMethodChange('cash')}
                  >
                    <Banknote className="h-4 w-4 me-2" />
                    {isArabic ? 'نقدي' : 'Cash'}
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'bank' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => handleMethodChange('bank')}
                  >
                    <Building2 className="h-4 w-4 me-2" />
                    {isArabic ? 'بنك' : 'Bank'}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account Selection (if multiple accounts of same type) */}
        {filteredAccounts.length > 1 && (
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isArabic ? 'الحساب' : 'Account'}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isArabic ? 'اختر الحساب' : 'Select account'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {isArabic ? account.nameAr : account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Reference */}
        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('reference')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={isArabic ? 'رقم التحويل أو المرجع' : 'Transfer number or reference'}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {isArabic ? 'اختياري - رقم مرجعي للعملية' : 'Optional - reference number for the transaction'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('notes')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={isArabic ? 'ملاحظات إضافية...' : 'Additional notes...'}
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {tCommon('cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {t('createEntry')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default PartnerEntryForm;
