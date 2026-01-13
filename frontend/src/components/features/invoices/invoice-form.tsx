'use client';

import { useState } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ServiceLineItem } from './service-line-item';
import { AttachmentUploader } from './attachment-uploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslations, useLocale } from 'next-intl';
import { Plus, Loader2, Calendar } from 'lucide-react';
import { Customer } from '@/types/models/customer';
import { ServiceCatalogItem } from '@/types/models/service-catalog';
import { PartnerOffice } from '@/types/models/partner-office';
import { Invoice } from '@/types/models/invoice';
import { QuickAddCustomerModal } from './quick-add-modals/customer-modal';
import { QuickAddPartnerModal } from './quick-add-modals/partner-modal';
import { QuickAddServiceModal } from './quick-add-modals/service-modal';
import { quickAddCustomerAction } from '@/app/actions/customers';
import { quickAddPartnerAction } from '@/app/actions/partners';
import { quickAddServiceAction } from '@/app/actions/services-catalog';
import { toast } from 'sonner';

interface InvoiceFormProps {
  invoice?: Invoice;
  customers: Customer[];
  services: ServiceCatalogItem[];
  partners: PartnerOffice[];
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  isPending?: boolean;
  mode?: 'create' | 'edit';
  /** Invoice status for edit mode (affects validation and UI) */
  status?: 'draft' | 'issued' | 'partial' | 'paid' | 'cancelled' | 'overdue';
  /** Amount already paid (for partial/paid invoices) */
  paidAmount?: number;
}

// Schema will be validated on submit
const defaultLineItem = {
  serviceCatalogId: '',
  serviceName: '',
  serviceNameAr: '',
  serviceType: 'other',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  total: 0,
  isOutsourced: false,
  partnerId: '',
  partnerName: '',
  commissionPercentage: 0,
  commissionAmount: 0,
  beneficiary: {
    name: '',
    relationship: 'self',
    idNumber: '',
    phone: ''
  },
  comments: '',
  attachments: [],
  displayOrder: 0
};

export function InvoiceForm({
  invoice,
  customers: initialCustomers,
  services: initialServices,
  partners: initialPartners,
  onSubmit,
  onCancel,
  isPending,
  mode = 'create',
  status,
  paidAmount = 0,
}: InvoiceFormProps) {
  const t = useTranslations();
  const locale = useLocale();

  // T088 [US10] State for dynamic lists (can be updated via quick-add)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [services, setServices] = useState<ServiceCatalogItem[]>(initialServices);
  const [partners, setPartners] = useState<PartnerOffice[]>(initialPartners);

  const form = useForm({
    defaultValues: invoice
      ? {
          customerId: invoice.customerId,
          lineItems: invoice.lineItems || [defaultLineItem],
          discount: invoice.discount || 0,
          discountPercentage: invoice.discountPercentage || 0,
          invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
          notes: invoice.notes || '',
          attachments: invoice.attachments || []
        }
      : {
          customerId: '',
          lineItems: [defaultLineItem],
          discount: 0,
          discountPercentage: 0,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          notes: '',
          attachments: []
        }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems'
  });

  // Watch for calculations
  const watchLineItems = form.watch('lineItems');
  const watchDiscount = form.watch('discount');
  const watchDiscountPercentage = form.watch('discountPercentage');

  // Calculate totals
  const subtotal = watchLineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const discountAmount = watchDiscountPercentage
    ? (subtotal * watchDiscountPercentage / 100)
    : (watchDiscount || 0);
  const total = Math.max(0, subtotal - discountAmount);

  // Calculate commission summary
  const commissionsByPartner = watchLineItems
    .filter(item => item.isOutsourced && item.partnerId)
    .reduce((acc, item) => {
      const existing = acc.find(c => c.partnerId === item.partnerId);
      if (existing) {
        existing.amount += item.commissionAmount || 0;
      } else {
        acc.push({
          partnerId: item.partnerId,
          partnerName: item.partnerName,
          amount: item.commissionAmount || 0
        });
      }
      return acc;
    }, [] as Array<{ partnerId: string; partnerName: string; amount: number }>);

  const totalCommissions = commissionsByPartner.reduce((sum, c) => sum + c.amount, 0);

  // Check if total would go below paid amount (for partial invoices)
  const isBelowPaidAmount = status === 'partial' && total < paidAmount;

  function handleAddLineItem() {
    append({
      ...defaultLineItem,
      displayOrder: fields.length
    });
  }

  async function handleSubmit(data: any) {
    // Validate partial invoice constraint
    if (isBelowPaidAmount) {
      toast.error(t('invoices.cannotReduceBelowPaid'));
      return;
    }

    // Add calculated fields
    const formData = {
      ...data,
      subtotal,
      discount: discountAmount,
      total,
      totalCommissions,
      commissionsByPartner: commissionsByPartner.map(c => ({
        ...c,
        status: 'pending' as const
      }))
    };

    await onSubmit(formData);
  }

  // T088 [US10] Quick-add handlers
  async function handleQuickAddCustomer(data: any) {
    const result = await quickAddCustomerAction(data);
    if (result.success && result.data) {
      setCustomers(prev => [...prev, result.data!]);
      toast.success(t('invoices.customerAdded'));
      return result.data;
    } else {
      toast.error(result.error || t('invoices.customerAddFailed'));
      throw new Error(result.error);
    }
  }

  async function handleQuickAddPartner(data: any) {
    const result = await quickAddPartnerAction(data);
    if (result.success && result.data?.partner) {
      setPartners(prev => [...prev, result.data!.partner]);
      toast.success(t('invoices.partnerAdded'));
      return result.data.partner;
    } else {
      toast.error(result.message || t('invoices.partnerAddFailed'));
      throw new Error(result.message);
    }
  }

  async function handleQuickAddService(data: any) {
    const result = await quickAddServiceAction(data);
    if (result.success && result.data) {
      setServices(prev => [...prev, result.data!]);
      toast.success(t('invoices.serviceAdded'));
      return result.data;
    } else {
      toast.error(result.error || t('invoices.serviceAddFailed'));
      throw new Error(result.error);
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t('invoices.customerInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.selectCustomer')}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const customer = customers.find(c => c.id === value);
                        if (customer) {
                          // Could pre-fill customer details if needed
                        }
                      }}
                      defaultValue={field.value}
                      disabled={isPending || mode === 'edit'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('invoices.selectCustomerPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.firstName} {customer.lastName} - {customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* T088 [US10] Quick-add customer button */}
              {mode === 'create' && (
                <QuickAddCustomerModal
                  onCustomerAdded={(customer) => {
                    form.setValue('customerId', customer.id);
                  }}
                  onCreateCustomer={handleQuickAddCustomer}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.invoiceDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('invoices.dueDate')} ({t('common.optional')})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('invoices.services')}</CardTitle>
              <div className="flex gap-2">
                {/* T088 [US10] Quick-add buttons */}
                <QuickAddServiceModal
                  onServiceAdded={(service) => {
                    // Service added to list automatically
                  }}
                  onCreateService={handleQuickAddService}
                />
                <QuickAddPartnerModal
                  onPartnerAdded={(partner) => {
                    // Partner added to list automatically
                  }}
                  onCreatePartner={handleQuickAddPartner}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  disabled={isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('invoices.addService')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <ServiceLineItem
                key={field.id}
                index={index}
                services={services}
                partners={partners}
                onRemove={() => remove(index)}
                disabled={isPending}
              />
            ))}

            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('invoices.noServicesAdded')}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('invoices.addFirstService')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals & Discount */}
        <Card>
          <CardHeader>
            <CardTitle>{t('invoices.totals')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-lg">
              <span className="text-muted-foreground">{t('invoices.subtotal')}:</span>
              <span className="font-medium">{subtotal.toFixed(2)}</span>
            </div>

            <Separator />

            {/* Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.discountAmount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
                          form.setValue('discountPercentage', 0);
                        }}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.discountPercentage')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        {...field}
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
                          form.setValue('discount', 0);
                        }}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center text-2xl font-bold">
              <span>{t('invoices.total')}:</span>
              <span className={isBelowPaidAmount ? 'text-red-600' : ''}>{total.toFixed(2)}</span>
            </div>

            {/* Paid Amount Display for partial/paid invoices */}
            {(status === 'partial' || status === 'paid') && paidAmount > 0 && (
              <div className="flex justify-between items-center text-lg text-green-600 dark:text-green-400">
                <span>{t('invoices.paidAmount')}:</span>
                <span>{paidAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Warning when total is below paid amount */}
            {isBelowPaidAmount && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t('invoices.cannotReduceBelowPaidWarning', { paidAmount: paidAmount.toFixed(2) })}
                </p>
              </div>
            )}

            {/* Commission Summary */}
            {commissionsByPartner.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">{t('invoices.commissionSummary')}:</h4>
                  {commissionsByPartner.map((comm) => (
                    <div key={comm.partnerId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{comm.partnerName}:</span>
                      <span>{comm.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-medium pt-2 border-t">
                    <span>{t('invoices.totalCommissions')}:</span>
                    <span>{totalCommissions.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes & Attachments */}
        <Card>
          <CardHeader>
            <CardTitle>{t('invoices.additionalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('invoices.notes')} ({t('common.optional')})
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('invoices.notesPlaceholder')}
                      disabled={isPending}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.invoiceAttachments')}</FormLabel>
                  <FormDescription>
                    {t('invoices.invoiceAttachmentsDescription')}
                  </FormDescription>
                  <FormControl>
                    <AttachmentUploader
                      attachments={field.value || []}
                      onAttachmentsChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

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
          <Button type="submit" disabled={isPending || fields.length === 0}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? t('invoices.createInvoice') : t('invoices.updateInvoice')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
