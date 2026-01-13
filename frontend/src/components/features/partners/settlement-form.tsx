'use client';

/**
 * Settlement Form Component
 *
 * Form for creating commission settlements
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
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
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  createSettlementSchema,
  type CreateSettlementInput,
} from '@/lib/validations/settlements';
import { usePartnerCommissions, type CommissionItem } from '@/hooks/use-partner-commissions';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettlementFormProps {
  partnerOfficeId: string;
  partnerOfficeName: string;
  currency: string;
  onSubmit: (data: CreateSettlementInput & { selectedCommissions: CommissionItem[] }) => Promise<void>;
  isLoading?: boolean;
  locale?: string;
}

export function SettlementForm({
  partnerOfficeId,
  partnerOfficeName,
  currency,
  onSubmit,
  isLoading,
  locale = 'en',
}: SettlementFormProps) {
  const isArabic = locale === 'ar';
  const dateLocale = isArabic ? arSA : enUS;

  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  const { commissions, loading: commissionsLoading } = usePartnerCommissions({
    partnerOfficeId,
    settled: false, // Only get unsettled commissions
  });

  const form = useForm<CreateSettlementInput>({
    resolver: zodResolver(createSettlementSchema),
    defaultValues: {
      partnerOfficeId,
      invoiceIds: [],
      periodStart: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      periodEnd: new Date(),
    },
  });

  const formatCurrency = (amount: number) => {
    // Always use 'en-US' locale for English numerals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const selectedCommissions = commissions.filter((c) =>
    selectedInvoiceIds.includes(c.invoiceId)
  );

  const totalAmount = selectedCommissions.reduce(
    (sum, c) => sum + c.commissionAmount,
    0
  );

  const handleInvoiceToggle = (invoiceId: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.length === commissions.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(commissions.map((c) => c.invoiceId));
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (selectedInvoiceIds.length === 0) {
      form.setError('invoiceIds', {
        message: isArabic ? 'يرجى اختيار فاتورة واحدة على الأقل' : 'Please select at least one invoice',
      });
      return;
    }

    // Get unique invoice IDs
    const uniqueInvoiceIds = [...new Set(selectedInvoiceIds)];

    await onSubmit({
      ...data,
      invoiceIds: uniqueInvoiceIds,
      selectedCommissions,
    });
  });

  // Group commissions by invoice
  const invoiceGroups = commissions.reduce((acc, commission) => {
    if (!acc[commission.invoiceId]) {
      acc[commission.invoiceId] = {
        invoiceId: commission.invoiceId,
        invoiceNumber: commission.invoiceNumber,
        invoiceDate: commission.invoiceDate,
        items: [],
        totalAmount: 0,
      };
    }
    acc[commission.invoiceId].items.push(commission);
    acc[commission.invoiceId].totalAmount += commission.commissionAmount;
    return acc;
  }, {} as Record<string, { invoiceId: string; invoiceNumber: string; invoiceDate: Date; items: CommissionItem[]; totalAmount: number }>);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Partner Info */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'إنشاء تسوية لـ' : 'Creating settlement for'}
          </p>
          <p className="text-lg font-semibold">{partnerOfficeName}</p>
        </div>

        {/* Period Selection */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="periodStart"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{isArabic ? 'بداية الفترة' : 'Period Start'}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: dateLocale })
                        ) : (
                          <span>{isArabic ? 'اختر تاريخ' : 'Pick a date'}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periodEnd"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{isArabic ? 'نهاية الفترة' : 'Period End'}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: dateLocale })
                        ) : (
                          <span>{isArabic ? 'اختر تاريخ' : 'Pick a date'}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Invoice Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <FormLabel>{isArabic ? 'اختر الفواتير' : 'Select Invoices'}</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              disabled={commissions.length === 0}
            >
              {selectedInvoiceIds.length === commissions.length
                ? isArabic ? 'إلغاء تحديد الكل' : 'Deselect All'
                : isArabic ? 'تحديد الكل' : 'Select All'}
            </Button>
          </div>

          {commissionsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : Object.keys(invoiceGroups).length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">
                {isArabic
                  ? 'لا توجد عمولات غير مسددة'
                  : 'No unsettled commissions available'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-4 space-y-3">
                {Object.values(invoiceGroups).map((group) => (
                  <div
                    key={group.invoiceId}
                    className={cn(
                      'flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedInvoiceIds.includes(group.invoiceId)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => handleInvoiceToggle(group.invoiceId)}
                  >
                    <Checkbox
                      checked={selectedInvoiceIds.includes(group.invoiceId)}
                      onCheckedChange={() => handleInvoiceToggle(group.invoiceId)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{group.invoiceNumber}</p>
                        <Badge variant="outline">
                          {formatCurrency(group.totalAmount)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(group.invoiceDate, 'PPP', { locale: dateLocale })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {group.items.length}{' '}
                        {isArabic ? 'خدمات' : group.items.length === 1 ? 'service' : 'services'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <FormField
            control={form.control}
            name="invoiceIds"
            render={() => <FormMessage />}
          />
        </div>

        {/* Summary */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'إجمالي التسوية' : 'Settlement Total'}
              </p>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="text-end">
              <p className="text-sm text-muted-foreground">
                {selectedInvoiceIds.length}{' '}
                {isArabic
                  ? 'فاتورة مختارة'
                  : selectedInvoiceIds.length === 1
                  ? 'invoice selected'
                  : 'invoices selected'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            disabled={isLoading || selectedInvoiceIds.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {isArabic ? 'جاري الإنشاء...' : 'Creating...'}
              </>
            ) : (
              isArabic ? 'إنشاء التسوية' : 'Create Settlement'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
