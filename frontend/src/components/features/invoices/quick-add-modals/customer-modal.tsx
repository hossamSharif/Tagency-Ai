'use client';

// T082 [US10] Quick-add customer modal
// Allows staff to quickly create a new customer from the invoice form
// Enhanced with passport scanning/OCR integration

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2, Plus, User, Camera } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Customer } from '@/types/models/customer';
import { PassportScanResult } from '@/types/models/passport';
import { CompactPassportScanner } from '../../passport-scanner/compact-passport-scanner';
import { mapPassportToCustomer } from '@/lib/utils/passport-mapper';
import { toast } from 'sonner';

// Quick-add customer schema (simplified - only essential fields)
const quickAddCustomerSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\s+()-]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  nationality: z.string().optional().or(z.literal('')),
});

type QuickAddCustomerInput = z.infer<typeof quickAddCustomerSchema>;

interface QuickAddCustomerModalProps {
  onCustomerAdded: (customer: Customer) => void;
  onCreateCustomer: (data: QuickAddCustomerInput) => Promise<Customer>;
}

export function QuickAddCustomerModal({
  onCustomerAdded,
  onCreateCustomer,
}: QuickAddCustomerModalProps) {
  const t = useTranslations();
  const tPassport = useTranslations('passport');
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'scan'>('manual');

  // Ref for auto-focus after scan
  const emailInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<QuickAddCustomerInput>({
    resolver: zodResolver(quickAddCustomerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationality: '',
    },
  });

  const handleSubmit = async (data: QuickAddCustomerInput) => {
    setIsPending(true);
    try {
      const customer = await onCreateCustomer(data);
      onCustomerAdded(customer);
      setOpen(false);
      form.reset();
      setActiveTab('manual'); // Reset to manual tab
    } catch (error) {
      console.error('Failed to create customer:', error);
      // Error handling is done in parent component
    } finally {
      setIsPending(false);
    }
  };

  // Handle passport scan completion
  const handleScanComplete = (scanResult: PassportScanResult) => {
    const mappedData = mapPassportToCustomer(scanResult);

    // Auto-fill form fields
    if (mappedData.firstName) form.setValue('firstName', mappedData.firstName);
    if (mappedData.lastName) form.setValue('lastName', mappedData.lastName);
    if (mappedData.nationality) form.setValue('nationality', mappedData.nationality);

    // Show success toast
    toast.success(tPassport('autoFillSuccess'));

    // Switch to manual tab
    setActiveTab('manual');

    // Auto-focus email field
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 300);
  };

  const handleScanError = (error: string) => {
    toast.error(tPassport('scanFailed'), {
      description: error,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('invoices.quickAddCustomer')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('invoices.quickAddCustomer')}
          </DialogTitle>
          <DialogDescription>
            {t('invoices.quickAddCustomerDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manual' | 'scan')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <User className="h-4 w-4" />
              {t('customers.manualEntry')}
            </TabsTrigger>
            <TabsTrigger value="scan" className="gap-2">
              <Camera className="h-4 w-4" />
              {t('customers.scanPassportTab')}
            </TabsTrigger>
          </TabsList>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('customers.firstName')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('customers.firstNamePlaceholder')}
                        disabled={isPending}
                      />
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
                    <FormLabel>{t('customers.lastName')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('customers.lastNamePlaceholder')}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('customers.email')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      ref={emailInputRef}
                      type="email"
                      placeholder={t('customers.emailPlaceholder')}
                      disabled={isPending}
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
                  <FormLabel>{t('customers.phone')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder={t('customers.phonePlaceholder')}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('customers.nationality')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('customers.nationalityPlaceholder')}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        {t('common.creating')}
                      </>
                    ) : (
                      <>
                        <Plus className="me-2 h-4 w-4" />
                        {t('common.create')}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Scan Passport Tab */}
          <TabsContent value="scan" className="mt-4">
            <div className="space-y-4">
              <CompactPassportScanner
                onScanComplete={handleScanComplete}
                onError={handleScanError}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
