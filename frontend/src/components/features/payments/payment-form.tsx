'use client';

// PaymentForm component for adding payments
// T149 [US3] Create PaymentForm component

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Banknote, Building2, Upload, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createCashPaymentSchema,
  createBankTransferPaymentSchema,
  CreateCashPaymentInput,
  CreateBankTransferPaymentInput,
} from '@/lib/validations/payments';
import { Invoice } from '@/types/models/invoice';

interface PaymentFormProps {
  invoice: Invoice;
  onCashPayment: (data: CreateCashPaymentInput) => Promise<void>;
  onBankTransfer: (data: CreateBankTransferPaymentInput) => Promise<void>;
  onStripeCheckout: (amount: number) => Promise<void>;
  onCancel: () => void;
}

export function PaymentForm({
  invoice,
  onCashPayment,
  onBankTransfer,
  onStripeCheckout,
  onCancel,
}: PaymentFormProps) {
  const t = useTranslations('payments');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('cash');

  const maxPayable = invoice.balance;

  const cashForm = useForm<CreateCashPaymentInput>({
    resolver: zodResolver(createCashPaymentSchema),
    defaultValues: {
      invoiceId: invoice.id,
      amount: maxPayable,
      notes: '',
    },
  });

  const bankForm = useForm<CreateBankTransferPaymentInput>({
    resolver: zodResolver(createBankTransferPaymentSchema),
    defaultValues: {
      invoiceId: invoice.id,
      amount: maxPayable,
      transactionReference: '',
      proofDocumentUrl: '',
      bankName: '',
      notes: '',
    },
  });

  const [stripeAmount, setStripeAmount] = useState(maxPayable);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  const handleCashSubmit = async (data: CreateCashPaymentInput) => {
    if (data.amount > maxPayable) {
      cashForm.setError('amount', {
        message: t('amountExceedsBalance', { max: formatCurrency(maxPayable) }),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onCashPayment(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankSubmit = async (data: CreateBankTransferPaymentInput) => {
    if (data.amount > maxPayable) {
      bankForm.setError('amount', {
        message: t('amountExceedsBalance', { max: formatCurrency(maxPayable) }),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onBankTransfer(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeSubmit = async () => {
    if (stripeAmount > maxPayable) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onStripeCheckout(stripeAmount);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invoice Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('invoiceSummary')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('invoice')}:</span>
            <span className="font-mono">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('total')}:</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('paid')}:</span>
            <span className="text-green-600">{formatCurrency(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-medium text-destructive">
            <span>{t('balance')}:</span>
            <span>{formatCurrency(invoice.balance)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cash" className="gap-2">
            <Banknote className="h-4 w-4" />
            {t('cash')}
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2">
            <Building2 className="h-4 w-4" />
            {t('bankTransfer')}
          </TabsTrigger>
          <TabsTrigger value="stripe" className="gap-2">
            <CreditCard className="h-4 w-4" />
            {t('stripe')}
          </TabsTrigger>
        </TabsList>

        {/* Cash Payment */}
        <TabsContent value="cash">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('cashPayment')}</CardTitle>
              <CardDescription>{t('cashPaymentDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={cashForm.handleSubmit(handleCashSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cash-amount">{t('amount')}</Label>
                  <Input
                    id="cash-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxPayable}
                    {...cashForm.register('amount', { valueAsNumber: true })}
                  />
                  {cashForm.formState.errors.amount && (
                    <p className="text-sm text-destructive">
                      {cashForm.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cash-notes">{t('notes')}</Label>
                  <Textarea
                    id="cash-notes"
                    rows={2}
                    placeholder={t('notesPlaceholder')}
                    {...cashForm.register('notes')}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('processing') : t('recordPayment')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Transfer */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('bankTransferPayment')}</CardTitle>
              <CardDescription>{t('bankTransferDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={bankForm.handleSubmit(handleBankSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-amount">{t('amount')}</Label>
                  <Input
                    id="bank-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxPayable}
                    {...bankForm.register('amount', { valueAsNumber: true })}
                  />
                  {bankForm.formState.errors.amount && (
                    <p className="text-sm text-destructive">
                      {bankForm.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionReference">{t('transactionReference')}</Label>
                  <Input
                    id="transactionReference"
                    placeholder={t('transactionReferencePlaceholder')}
                    {...bankForm.register('transactionReference')}
                  />
                  {bankForm.formState.errors.transactionReference && (
                    <p className="text-sm text-destructive">
                      {bankForm.formState.errors.transactionReference.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">{t('bankName')}</Label>
                  <Input
                    id="bankName"
                    placeholder={t('bankNamePlaceholder')}
                    {...bankForm.register('bankName')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proofDocumentUrl">{t('proofDocument')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="proofDocumentUrl"
                      placeholder={t('proofDocumentPlaceholder')}
                      {...bankForm.register('proofDocumentUrl')}
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {bankForm.formState.errors.proofDocumentUrl && (
                    <p className="text-sm text-destructive">
                      {bankForm.formState.errors.proofDocumentUrl.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{t('proofDocumentHint')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank-notes">{t('notes')}</Label>
                  <Textarea
                    id="bank-notes"
                    rows={2}
                    placeholder={t('notesPlaceholder')}
                    {...bankForm.register('notes')}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('processing') : t('submitForApproval')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stripe */}
        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('stripePayment')}</CardTitle>
              <CardDescription>{t('stripePaymentDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-amount">{t('amount')}</Label>
                <Input
                  id="stripe-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxPayable}
                  value={stripeAmount}
                  onChange={(e) => setStripeAmount(parseFloat(e.target.value) || 0)}
                />
                {stripeAmount > maxPayable && (
                  <p className="text-sm text-destructive">
                    {t('amountExceedsBalance', { max: formatCurrency(maxPayable) })}
                  </p>
                )}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg text-sm">
                <p className="text-muted-foreground">{t('stripeRedirectNote')}</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleStripeSubmit}
                  disabled={isSubmitting || stripeAmount > maxPayable || stripeAmount <= 0}
                >
                  {isSubmitting ? t('processing') : (
                    <>
                      <ExternalLink className="me-2 h-4 w-4" />
                      {t('payWithStripe')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
