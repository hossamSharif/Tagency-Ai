'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountSchema, AccountInput } from '@/lib/validations/accounting';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';
import { Account, AccountType, AccountSubtype } from '@/types/models/account';
import { Loader2 } from 'lucide-react';

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: AccountInput) => Promise<void>;
  onCancel?: () => void;
  isPending?: boolean;
}

// Map subtypes to their parent account types
const subtypeToType: Record<AccountSubtype, AccountType> = {
  cash: 'asset',
  bank: 'asset',
  receivable: 'asset',
  payable: 'liability',
  revenue: 'income',
  expense_general: 'expense',
  expense_rent: 'expense',
  expense_utilities: 'expense',
  expense_supplies: 'expense',
  expense_other: 'expense'
};

// Get available subtypes for a given account type
function getSubtypesForType(type: AccountType): AccountSubtype[] {
  return (Object.keys(subtypeToType) as AccountSubtype[]).filter(
    (subtype) => subtypeToType[subtype] === type
  );
}

export function AccountForm({ account, onSubmit, onCancel, isPending }: AccountFormProps) {
  const t = useTranslations();

  const form = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: account
      ? {
          code: account.code,
          name: account.name,
          nameAr: account.nameAr,
          description: account.description || '',
          type: account.type,
          subtype: account.subtype,
          linkedEntityType: account.linkedEntityType,
          linkedEntityId: account.linkedEntityId,
          isSystem: account.isSystem,
          isActive: account.isActive
        }
      : {
          code: '',
          name: '',
          nameAr: '',
          description: '',
          type: 'asset',
          subtype: 'cash',
          isSystem: false,
          isActive: true
        }
  });

  const watchType = form.watch('type');
  const isEditMode = !!account;

  // Update subtype when type changes
  const handleTypeChange = (newType: AccountType) => {
    const availableSubtypes = getSubtypesForType(newType);
    if (availableSubtypes.length > 0) {
      form.setValue('subtype', availableSubtypes[0]);
    }
  };

  async function handleSubmit(data: AccountInput) {
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Account Code */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accounting.code')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="1001"
                  disabled={isEditMode || isPending}
                  className="font-mono"
                />
              </FormControl>
              <FormDescription>
                {t('accounting.codeDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accounting.type')}</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleTypeChange(value as AccountType);
                }}
                defaultValue={field.value}
                disabled={isEditMode || isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('accounting.selectType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="asset">{t('accounting.accountTypes.asset')}</SelectItem>
                  <SelectItem value="liability">{t('accounting.accountTypes.liability')}</SelectItem>
                  <SelectItem value="income">{t('accounting.accountTypes.income')}</SelectItem>
                  <SelectItem value="expense">{t('accounting.accountTypes.expense')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account Subtype */}
        <FormField
          control={form.control}
          name="subtype"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accounting.subtype')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('accounting.selectSubtype')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getSubtypesForType(watchType).map((subtype) => (
                    <SelectItem key={subtype} value={subtype}>
                      {t(`accounting.subtypes.${subtype}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account Name (English) */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accounting.accountName')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('accounting.accountNamePlaceholder')}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account Name (Arabic) */}
        <FormField
          control={form.control}
          name="nameAr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accounting.accountNameArabic')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('accounting.accountNameArabicPlaceholder')}
                  disabled={isPending}
                  dir="rtl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.description')} ({t('common.optional')})</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('accounting.descriptionPlaceholder')}
                  disabled={isPending}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t('accounting.activeStatus')}</FormLabel>
                <FormDescription>
                  {t('accounting.activeStatusDescription')}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? t('common.update') : t('common.create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
