'use client';

// CustomerForm component
// T110 [US2] Create CustomerForm component
// Enhanced with passport scanning/OCR integration

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Save, User, Camera, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { createCustomerSchema, CreateCustomerInput } from '@/lib/validations/customers';
import { Customer } from '@/types/models/customer';
import { PassportScanResult } from '@/types/models/passport';
import { PassportQuickScan } from '../passport-scanner/passport-quick-scan';
import { mapPassportToCustomer } from '@/lib/utils/passport-mapper';
import { toast } from 'sonner';

// Common country codes
const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SD', name: 'Sudan' },
  { code: 'YE', name: 'Yemen' },
  { code: 'JO', name: 'Jordan' },
  { code: 'SY', name: 'Syria' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'IN', name: 'India' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
];

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CreateCustomerInput, passportImage?: File) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  isLoading,
}: CustomerFormProps) {
  const t = useTranslations('customers');
  const tPassport = useTranslations('passport');

  // State for collapsible passport scanner section
  const [showScanner, setShowScanner] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  // State for passport image file to be uploaded
  const [passportImageFile, setPassportImageFile] = useState<File | null>(null);

  // Refs for auto-focus after scan
  const emailInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      nationality: customer?.nationality || '',
      nationalId: customer?.nationalId || '',
      notes: customer?.notes || '',
      tags: customer?.tags || [],
      address: customer?.address || undefined,
    },
  });

  const handleSubmit = async (data: CreateCustomerInput) => {
    await onSubmit(data, passportImageFile || undefined);
  };

  // Handle passport scan auto-fill
  const handlePassportAutoFill = (scanResult: PassportScanResult) => {
    const mappedData = mapPassportToCustomer(scanResult);

    // Store the passport image file for automatic upload
    if (scanResult.capturedImage) {
      setPassportImageFile(scanResult.capturedImage);
    }

    // Auto-fill form fields with staggered animation
    const fieldsToFill = [
      { name: 'firstName' as const, value: mappedData.firstName },
      { name: 'lastName' as const, value: mappedData.lastName },
      { name: 'nationality' as const, value: mappedData.nationality },
      { name: 'passport' as const, value: mappedData.passport },
    ];

    let delay = 0;
    fieldsToFill.forEach(({ name, value }) => {
      if (value) {
        setTimeout(() => {
          form.setValue(name, value as any);
          // Trigger field highlight animation
          const fieldElement = document.querySelector(`[name="${name}"]`);
          if (fieldElement) {
            fieldElement.classList.add('field-auto-filled');
            setTimeout(() => fieldElement.classList.remove('field-auto-filled'), 1000);
          }
        }, delay);
        delay += 100;
      }
    });

    // Show success toast
    toast.success(tPassport('autoFillSuccess'), {
      description: tPassport('reviewAndComplete'),
    });

    // Mark as scanned and collapse scanner
    setHasScanned(true);
    setShowScanner(false);

    // Auto-focus email field after animation completes
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, delay + 200);
  };

  const handleScanError = (error: string) => {
    toast.error(tPassport('scanFailed'), {
      description: error,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {customer ? t('editCustomer') : t('createCustomer')}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {/* Passport Scanner Section (Only for new customers) */}
            {!customer && (
              <Collapsible open={showScanner} onOpenChange={setShowScanner}>
                <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
                  <CardContent className="pt-4">
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between gap-2 h-auto py-3"
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="h-5 w-5 text-primary" />
                          <div className="text-start">
                            <div className="font-semibold">{tPassport('scanPassportOptional')}</div>
                            <div className="text-xs text-muted-foreground font-normal">
                              {tPassport('autoFillDescription')}
                            </div>
                          </div>
                        </div>
                        {showScanner ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-4">
                      <PassportQuickScan
                        onAutoFill={handlePassportAutoFill}
                        onScanError={handleScanError}
                      />
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            )}

            {/* Visual indicator when passport image is captured */}
            {!customer && passportImageFile && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    {tPassport('imageWillBeSaved')}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 truncate">
                    {passportImageFile.name} ({(passportImageFile.size / 1024).toFixed(0)} KB)
                  </p>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('firstName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('firstNamePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('lastName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('lastNamePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        ref={emailInputRef}
                        type="email"
                        placeholder="email@example.com"
                        className={hasScanned && !field.value ? 'ring-2 ring-primary/50 animate-pulse-slow' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+966 5x xxx xxxx" dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nationality and ID */}
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
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
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
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nationalId')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('nationalIdPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-medium">{t('address')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('city')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('cityPlaceholder')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('country')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('countryPlaceholder')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('street')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('streetPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('notesPlaceholder')}
                      rows={3}
                    />
                  </FormControl>
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
              {customer ? t('saveChanges') : t('createCustomer')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
