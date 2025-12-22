'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { BeneficiaryRelationship } from '@/types/models/invoice';

interface BeneficiaryFormProps {
  fieldPrefix: string; // e.g., "lineItems.0.beneficiary"
  disabled?: boolean;
}

const relationships: BeneficiaryRelationship[] = [
  'self',
  'spouse',
  'child',
  'parent',
  'sibling',
  'other'
];

export function BeneficiaryForm({ fieldPrefix, disabled }: BeneficiaryFormProps) {
  const t = useTranslations();
  const form = useFormContext();

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <h4 className="text-sm font-medium">{t('invoices.beneficiaryInfo')}</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Beneficiary Name */}
        <FormField
          control={form.control}
          name={`${fieldPrefix}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('invoices.beneficiaryName')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('invoices.beneficiaryNamePlaceholder')}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Relationship */}
        <FormField
          control={form.control}
          name={`${fieldPrefix}.relationship`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('invoices.relationship')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('invoices.selectRelationship')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {relationships.map((rel) => (
                    <SelectItem key={rel} value={rel}>
                      {t(`invoices.relationships.${rel}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ID Number */}
        <FormField
          control={form.control}
          name={`${fieldPrefix}.idNumber`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('invoices.idNumber')} ({t('common.optional')})
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('invoices.idNumberPlaceholder')}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name={`${fieldPrefix}.phone`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('invoices.beneficiaryPhone')} ({t('common.optional')})
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder={t('invoices.phonePlaceholder')}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
