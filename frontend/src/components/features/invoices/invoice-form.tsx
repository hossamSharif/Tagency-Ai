'use client';

// InvoiceForm component for generating/editing invoices
// T145 [US3] Create InvoiceForm component

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  generateInvoiceSchema,
  updateInvoiceSchema,
  GenerateInvoiceInput,
  UpdateInvoiceInput,
} from '@/lib/validations/invoices';
import { Booking } from '@/types/models/booking';
import { Invoice } from '@/types/models/invoice';

interface GenerateInvoiceFormProps {
  mode: 'generate';
  booking: Booking;
  onSubmit: (data: GenerateInvoiceInput) => Promise<void>;
  onCancel: () => void;
}

interface UpdateInvoiceFormProps {
  mode: 'update';
  invoice: Invoice;
  onSubmit: (data: UpdateInvoiceInput) => Promise<void>;
  onCancel: () => void;
}

type InvoiceFormProps = GenerateInvoiceFormProps | UpdateInvoiceFormProps;

export function InvoiceForm(props: InvoiceFormProps) {
  const t = useTranslations('invoices');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isGenerate = props.mode === 'generate';
  const defaultDueDate = addDays(new Date(), 30);

  const form = useForm<GenerateInvoiceInput | UpdateInvoiceInput>({
    resolver: zodResolver(isGenerate ? generateInvoiceSchema : updateInvoiceSchema),
    defaultValues: isGenerate
      ? {
          bookingId: props.booking.id,
          dueDate: format(defaultDueDate, 'yyyy-MM-dd'),
          discount: 0,
          tax: 0,
          notes: '',
          terms: t('defaultTerms'),
        }
      : {
          discount: props.invoice.discount,
          discountPercentage: props.invoice.discountPercentage,
          tax: props.invoice.tax,
          taxPercentage: props.invoice.taxPercentage,
          dueDate: format(props.invoice.dueDate.toDate(), 'yyyy-MM-dd'),
          notes: props.invoice.notes,
          terms: props.invoice.terms,
        },
  });

  const [dueDate, setDueDate] = useState<Date>(
    isGenerate ? defaultDueDate : props.invoice.dueDate.toDate()
  );

  const handleSubmit = async (data: GenerateInvoiceInput | UpdateInvoiceInput) => {
    setIsSubmitting(true);
    try {
      await props.onSubmit(data as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Booking Summary (Generate mode) */}
      {isGenerate && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h3 className="font-medium">{t('bookingSummary')}</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">{t('booking')}: </span>
              {props.booking.bookingNumber}
            </p>
            <p>
              <span className="text-muted-foreground">{t('package')}: </span>
              {props.booking.packageSnapshot.name}
            </p>
            <p>
              <span className="text-muted-foreground">{t('travelers')}: </span>
              {props.booking.travelers.length}
            </p>
            <p>
              <span className="text-muted-foreground">{t('total')}: </span>
              <span className="font-medium">
                {formatCurrency(props.booking.totalAmount, props.booking.currency)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Due Date */}
      <div className="space-y-2">
        <Label>{t('dueDate')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dueDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="me-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'PPP') : t('selectDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(date) => {
                if (date) {
                  setDueDate(date);
                  form.setValue('dueDate', format(date, 'yyyy-MM-dd'));
                }
              }}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {form.formState.errors.dueDate && (
          <p className="text-sm text-destructive">
            {form.formState.errors.dueDate.message}
          </p>
        )}
      </div>

      {/* Discount */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount">{t('discount')}</Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            min="0"
            {...form.register('discount', { valueAsNumber: true })}
          />
          {form.formState.errors.discount && (
            <p className="text-sm text-destructive">
              {form.formState.errors.discount.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountPercentage">{t('discountPercentage')}</Label>
          <Input
            id="discountPercentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="%"
            {...form.register('discountPercentage', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Tax */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tax">{t('tax')}</Label>
          <Input
            id="tax"
            type="number"
            step="0.01"
            min="0"
            {...form.register('tax', { valueAsNumber: true })}
          />
          {form.formState.errors.tax && (
            <p className="text-sm text-destructive">
              {form.formState.errors.tax.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxPercentage">{t('taxPercentage')}</Label>
          <Input
            id="taxPercentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="%"
            {...form.register('taxPercentage', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t('notes')}</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder={t('notesPlaceholder')}
          {...form.register('notes')}
        />
      </div>

      {/* Terms */}
      <div className="space-y-2">
        <Label htmlFor="terms">{t('terms')}</Label>
        <Textarea
          id="terms"
          rows={2}
          placeholder={t('termsPlaceholder')}
          {...form.register('terms')}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={props.onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('processing')
            : isGenerate
            ? t('generateInvoice')
            : t('updateInvoice')}
        </Button>
      </div>
    </form>
  );
}
