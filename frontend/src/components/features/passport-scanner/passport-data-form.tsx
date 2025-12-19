'use client';

// PassportDataForm for manual correction
// T109 [US2] Create PassportDataForm component

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { updatePassportSchema, UpdatePassportInput } from '@/lib/validations/customers';
import { PassportScanResult, PassportFormData } from '@/types/models/passport';

// Common country codes
const COUNTRY_CODES = [
  { code: 'SAU', name: 'Saudi Arabia' },
  { code: 'ARE', name: 'United Arab Emirates' },
  { code: 'EGY', name: 'Egypt' },
  { code: 'SDN', name: 'Sudan' },
  { code: 'YEM', name: 'Yemen' },
  { code: 'JOR', name: 'Jordan' },
  { code: 'SYR', name: 'Syria' },
  { code: 'IRQ', name: 'Iraq' },
  { code: 'KWT', name: 'Kuwait' },
  { code: 'QAT', name: 'Qatar' },
  { code: 'BHR', name: 'Bahrain' },
  { code: 'OMN', name: 'Oman' },
  { code: 'LBN', name: 'Lebanon' },
  { code: 'PAK', name: 'Pakistan' },
  { code: 'IND', name: 'India' },
  { code: 'BGD', name: 'Bangladesh' },
  { code: 'IDN', name: 'Indonesia' },
  { code: 'MYS', name: 'Malaysia' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'USA', name: 'United States' },
  { code: 'FRA', name: 'France' },
  { code: 'DEU', name: 'Germany' },
];

interface PassportDataFormProps {
  initialData?: PassportScanResult;
  onSubmit: (data: PassportFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function PassportDataForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: PassportDataFormProps) {
  const t = useTranslations('passport');

  // Get initial values from scan result or empty
  const getInitialValues = (): PassportFormData => {
    if (!initialData?.extractedData) {
      return {
        passportNumber: '',
        fullName: '',
        dateOfBirth: '',
        expiryDate: '',
        nationality: '',
        gender: 'M',
        issuingCountry: '',
      };
    }

    const { extractedData } = initialData;
    return {
      passportNumber: extractedData.passportNumber || '',
      fullName: extractedData.fullName || `${extractedData.firstName || ''} ${extractedData.lastName || ''}`.trim(),
      dateOfBirth: extractedData.dateOfBirth || '',
      expiryDate: extractedData.expiryDate || '',
      nationality: extractedData.nationality || '',
      gender: extractedData.gender || 'M',
      issuingCountry: extractedData.issuingCountry || '',
    };
  };

  const form = useForm<PassportFormData>({
    resolver: zodResolver(updatePassportSchema),
    defaultValues: getInitialValues(),
  });

  const handleSubmit = async (data: PassportFormData) => {
    await onSubmit(data);
  };

  // Get confidence indicator color
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-200';
    if (confidence >= 80) return 'bg-green-200';
    if (confidence >= 50) return 'bg-yellow-200';
    return 'bg-red-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('verifyPassportData')}</CardTitle>
        {initialData && (
          <p className="text-sm text-muted-foreground">
            {t('reviewAndCorrect')}
          </p>
        )}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="passportNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    {t('passportNumber')}
                    {initialData?.fieldConfidence?.passportNumber && (
                      <span className={`text-xs px-2 py-0.5 rounded ${getConfidenceColor(initialData.fieldConfidence.passportNumber)}`}>
                        {Math.round(initialData.fieldConfidence.passportNumber)}%
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="A12345678"
                      className="font-mono uppercase"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    {t('fullName')}
                    {initialData?.fieldConfidence?.fullName && (
                      <span className={`text-xs px-2 py-0.5 rounded ${getConfidenceColor(initialData.fieldConfidence.fullName)}`}>
                        {Math.round(initialData.fieldConfidence.fullName)}%
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('fullNamePlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      {t('dateOfBirth')}
                      {initialData?.fieldConfidence?.dateOfBirth && (
                        <span className={`text-xs px-2 py-0.5 rounded ${getConfidenceColor(initialData.fieldConfidence.dateOfBirth)}`}>
                          {Math.round(initialData.fieldConfidence.dateOfBirth)}%
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      {t('expiryDate')}
                      {initialData?.fieldConfidence?.expiryDate && (
                        <span className={`text-xs px-2 py-0.5 rounded ${getConfidenceColor(initialData.fieldConfidence.expiryDate)}`}>
                          {Math.round(initialData.fieldConfidence.expiryDate)}%
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nationality')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectCountry')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRY_CODES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name} ({country.code})
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
                name="issuingCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('issuingCountry')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectCountry')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRY_CODES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name} ({country.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gender')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="M">{t('male')}</SelectItem>
                      <SelectItem value="F">{t('female')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="me-2 h-4 w-4" />
              )}
              {t('save')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
