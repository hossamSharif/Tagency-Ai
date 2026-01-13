'use client';

// T053 [P] [US4] Partner payment form component
// Allows staff to record payments made to partners with commission deduction

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Timestamp } from 'firebase/firestore';
import { Loader2, Upload, X, Calculator, FileText, CheckCircle } from 'lucide-react';
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
import { CreatePartnerPaymentInput } from '@/types/models/payment';
import { Attachment } from '@/types/models/expense';
import { Account } from '@/types/models/account';
import { CurrencyCode } from '@/types/models/tenant';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PartnerInvoiceSelector, CalculatedTotals, PartnerInvoiceSelectorHandle } from './partner-invoice-selector';

// Validation schema - amounts allow 0 because in invoice-based mode they're stored in a ref, not the form
const partnerPaymentSchema = z.object({
  partnerId: z.string().min(1, 'Partner is required'),
  partnerName: z.string().min(1),
  invoiceIds: z.array(z.string()).optional(),
  grossAmount: z.number().min(0),
  commissionPercentage: z.number().min(0).max(100, 'Commission must be between 0-100%'),
  commissionAmount: z.number().min(0),
  netAmount: z.number().min(0),
  method: z.enum(['cash', 'bank'] as const),
  accountId: z.string().min(1, 'Payment account is required'),
  accountName: z.string().min(1),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

type PartnerPaymentFormData = z.infer<typeof partnerPaymentSchema>;

interface PartnerPaymentFormProps {
  partnerId: string;
  partnerName: string;
  invoiceIds?: string[];
  invoiceNumber?: string; // For display in single-invoice mode
  defaultGrossAmount?: number;
  defaultCommissionPercentage?: number;
  currency: CurrencyCode;
  accounts: Account[];
  onSubmit: (data: CreatePartnerPaymentInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'invoice-based' | 'manual' | 'single-invoice';
  locale?: string;
}

export function PartnerPaymentForm({
  partnerId,
  partnerName,
  invoiceIds,
  invoiceNumber,
  defaultGrossAmount = 0,
  defaultCommissionPercentage = 0,
  currency,
  accounts,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'manual',
  locale = 'en',
}: PartnerPaymentFormProps) {
  const t = useTranslations();
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Ref to access invoice selector's selection imperatively (no callbacks, no re-render loops)
  const invoiceSelectorRef = useRef<PartnerInvoiceSelectorHandle>(null);

  // Calculate commission and net amount - defined first so it can be used below
  const calculateAmounts = useCallback((gross: number, commissionPct: number) => {
    const commission = (gross * commissionPct) / 100;
    const net = gross - commission;
    return { commission, net };
  }, []);

  // Filter accounts to only cash and bank - memoize to prevent infinite loops
  const paymentAccounts = useMemo(() =>
    accounts.filter((acc) => acc.subtype === 'cash' || acc.subtype === 'bank'),
    [accounts]
  );

  const form = useForm<PartnerPaymentFormData>({
    resolver: zodResolver(partnerPaymentSchema),
    defaultValues: {
      partnerId,
      partnerName,
      invoiceIds: invoiceIds || [],
      grossAmount: defaultGrossAmount,
      commissionPercentage: defaultCommissionPercentage,
      commissionAmount: calculateAmounts(defaultGrossAmount, defaultCommissionPercentage).commission,
      netAmount: calculateAmounts(defaultGrossAmount, defaultCommissionPercentage).net,
      method: 'cash',
      accountId: paymentAccounts.find((acc) => acc.subtype === 'cash')?.id || '',
      accountName: '',
      transactionReference: '',
      notes: '',
    },
  });

  // Watch form fields for changes
  const watchedAccountId = form.watch('accountId');
  const watchedMethod = form.watch('method');

  // Update account name when account ID changes
  useEffect(() => {
    const account = paymentAccounts.find((acc) => acc.id === watchedAccountId);
    if (account) {
      form.setValue('accountName', account.name, { shouldValidate: false });
    }
  }, [watchedAccountId, paymentAccounts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate amounts when gross amount or commission percentage changes (manual mode only)
  useEffect(() => {
    if (mode !== 'manual') return;

    const subscription = form.watch((value, { name }) => {
      if (name === 'grossAmount' || name === 'commissionPercentage') {
        const gross = value.grossAmount || 0;
        const commissionPct = value.commissionPercentage || 0;
        const { commission, net } = calculateAmounts(gross, commissionPct);
        form.setValue('commissionAmount', parseFloat(commission.toFixed(2)), { shouldValidate: false });
        form.setValue('netAmount', parseFloat(net.toFixed(2)), { shouldValidate: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (data: PartnerPaymentFormData) => {
    // In invoice-based mode, get selection from the selector ref
    let totals: { grossAmount: number; commissionAmount: number; netAmount: number };
    let selectedIds: string[] = [];

    if (mode === 'invoice-based') {
      // Get selection from the invoice selector via imperative handle
      const selection = invoiceSelectorRef.current?.getSelection();
      if (!selection || selection.invoiceIds.length === 0) {
        return; // No invoices selected - button should be disabled anyway
      }
      selectedIds = selection.invoiceIds;
      totals = {
        grossAmount: selection.totals.grossAmount,
        commissionAmount: selection.totals.commissionAmount,
        netAmount: selection.totals.netAmount,
      };
    } else if (mode === 'single-invoice') {
      // Use the default values passed in props
      selectedIds = invoiceIds || [];
      const { commission, net } = calculateAmounts(defaultGrossAmount, defaultCommissionPercentage);
      totals = {
        grossAmount: defaultGrossAmount,
        commissionAmount: commission,
        netAmount: net,
      };
    } else {
      // Manual mode - use form values
      totals = {
        grossAmount: data.grossAmount,
        commissionAmount: data.commissionAmount,
        netAmount: data.netAmount,
      };
    }

    // Validate totals before submission
    if (totals.grossAmount <= 0 || totals.netAmount <= 0) {
      return; // Invalid amounts
    }

    const paymentData: CreatePartnerPaymentInput = {
      paymentType: 'partner_payment',
      partnerId: data.partnerId,
      partnerName: data.partnerName,
      invoiceIds: selectedIds.length > 0 ? selectedIds : undefined,
      grossAmount: totals.grossAmount,
      commissionAmount: totals.commissionAmount,
      netAmount: totals.netAmount,
      currency,
      method: data.method,
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
    // For now, simulate upload with temporary URL
    const file = files[0];
    const attachment: Attachment = {
      id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file), // Temporary URL - would be Firebase Storage URL in production
      type: file.type,
      size: file.size,
      uploadedAt: Timestamp.now(),
    };

    setAttachments([...attachments, attachment]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('payments.recordPartnerPayment')}</CardTitle>
        <CardDescription>
          {t('payments.recordPaymentToPartner')} {partnerName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Partner Info */}
            <FormField
              control={form.control}
              name="partnerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.partner.partner')}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Invoice Selection (invoice-based mode) */}
            {mode === 'invoice-based' && (
              <PartnerInvoiceSelector
                ref={invoiceSelectorRef}
                partnerId={partnerId}
                currency={currency}
                locale={locale}
              />
            )}

            {/* Single Invoice Summary (single-invoice mode) */}
            {mode === 'single-invoice' && (
              <div className="rounded-lg border p-4 bg-muted/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{t('payments.singleInvoicePayment')}</span>
                  </div>
                  {invoiceNumber && (
                    <Badge variant="outline">{invoiceNumber}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('payments.grossAmount')}</p>
                    <p className="text-xl font-bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency,
                        minimumFractionDigits: 0,
                      }).format(defaultGrossAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('payments.commissionPercentage')}</p>
                    <p className="text-xl font-bold">{defaultCommissionPercentage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('payments.commissionAmount')}</p>
                    <p className="text-xl font-bold text-primary">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency,
                        minimumFractionDigits: 0,
                      }).format(calculateAmounts(defaultGrossAmount, defaultCommissionPercentage).commission)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('payments.netAmount')}</p>
                    <p className="text-xl font-bold text-green-600">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency,
                        minimumFractionDigits: 0,
                      }).format(calculateAmounts(defaultGrossAmount, defaultCommissionPercentage).net)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t('payments.payingForInvoice')}</span>
                </div>
              </div>
            )}

            {/* Commission Calculation Section */}
            <Alert>
              <Calculator className="h-4 w-4" />
              <AlertDescription>
                {mode === 'invoice-based'
                  ? t('payments.calculatedFromInvoices')
                  : mode === 'single-invoice'
                  ? t('payments.calculatedFromInvoice')
                  : t('payments.commissionCalculation')}
              </AlertDescription>
            </Alert>

            {/* Gross Amount - Only shown in manual mode */}
            {mode === 'manual' && (
              <FormField
                control={form.control}
                name="grossAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payments.grossAmount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('payments.grossAmountHelp')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Commission Percentage - Only shown in manual mode */}
            {mode === 'manual' && (
              <FormField
                control={form.control}
                name="commissionPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payments.commissionPercentage')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('payments.commissionPercentageHelp')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Commission Amount (Read-only, calculated) - Only shown in manual mode */}
            {mode === 'manual' && (
              <FormField
                control={form.control}
                name="commissionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payments.commissionAmount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        disabled
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormDescription>
                      {t('payments.commissionAmountHelp')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Net Amount (Read-only, calculated) - Only shown in manual mode */}
            {mode === 'manual' && (
              <FormField
                control={form.control}
                name="netAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payments.netAmount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        disabled
                        className="bg-muted font-semibold"
                      />
                    </FormControl>
                    <FormDescription>
                      {t('payments.netAmountHelp')} {currency}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.paymentMethod')}</FormLabel>
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
            {watchedMethod === 'bank' && (
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
                  id="partner-payment-attachment"
                  accept="image/*,.pdf"
                />
                <label htmlFor="partner-payment-attachment">
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
