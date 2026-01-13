'use client';

/**
 * Partner Invoice Selector Component
 *
 * Multi-select invoice list for partner payments
 * Shows invoices with pending commissions and auto-calculates totals
 *
 * Uses forwardRef/useImperativeHandle pattern to expose selection to parent
 * without causing re-render loops through callbacks
 */

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, memo } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
// Removed Checkbox and ScrollArea imports - using native elements to debug infinite loop
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInvoicesWithPendingCommissionsAction, InvoiceWithCommission } from '@/app/actions/invoices';
import { useTenant } from '@/hooks/use-tenant';

export interface CalculatedTotals {
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  avgCommissionPct: number;
}

// Imperative handle interface for parent to read selection
export interface PartnerInvoiceSelectorHandle {
  getSelection: () => { invoiceIds: string[]; totals: CalculatedTotals };
  hasSelection: () => boolean;
}

interface PartnerInvoiceSelectorProps {
  partnerId: string;
  currency?: string;
  locale?: string;
}

// Wrap with memo to prevent parent re-renders from affecting this component
export const PartnerInvoiceSelector = memo(forwardRef<PartnerInvoiceSelectorHandle, PartnerInvoiceSelectorProps>(
  function PartnerInvoiceSelector({
    partnerId,
    currency = 'SAR',
    locale = 'en',
  }, ref) {
  const t = useTranslations('payments');
  const { tenant } = useTenant();
  const isArabic = locale === 'ar';
  const dateLocale = isArabic ? arSA : enUS;

  const [invoices, setInvoices] = useState<InvoiceWithCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Internal selection state - component is fully self-contained
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  // Store tenant ID in ref to avoid dependency changes
  const tenantIdRef = useRef<string | undefined>(undefined);

  // Only update ref when tenant ID actually changes
  useEffect(() => {
    if (tenant?.id && tenant.id !== tenantIdRef.current) {
      tenantIdRef.current = tenant.id;
    }
  }, [tenant?.id]);

  // Fetch invoices with pending commissions - only when partnerId changes
  useEffect(() => {
    let cancelled = false;

    async function fetchInvoices() {
      const currentTenantId = tenantIdRef.current || tenant?.id;
      if (!currentTenantId || !partnerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getInvoicesWithPendingCommissionsAction(currentTenantId, partnerId);

        if (cancelled) return;

        if (result.success) {
          setInvoices(result.data);
        } else {
          setError(result.error || 'Failed to fetch invoices');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    // Only fetch if we have tenant ID
    if (tenant?.id || tenantIdRef.current) {
      fetchInvoices();
    }

    return () => { cancelled = true; };
  }, [partnerId, tenant?.id]);

  // Calculate totals helper function - memoized based on invoices ref
  const invoicesRef = useRef<InvoiceWithCommission[]>([]);
  invoicesRef.current = invoices;

  const calculateTotals = useCallback((selected: string[]): CalculatedTotals => {
    const currentInvoices = invoicesRef.current;
    const selectedInvoices = currentInvoices.filter((inv) =>
      selected.includes(inv.invoiceId)
    );

    const grossAmount = selectedInvoices.reduce((sum, inv) => sum + inv.grossAmount, 0);
    const commissionAmount = selectedInvoices.reduce((sum, inv) => sum + inv.commissionAmount, 0);
    const netAmount = grossAmount - commissionAmount;
    const avgCommissionPct = grossAmount > 0 ? (commissionAmount / grossAmount) * 100 : 0;

    return { grossAmount, commissionAmount, netAmount, avgCommissionPct };
  }, []); // No dependencies - uses ref

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Use a ref to track current selection for immediate access
  const selectedIdsRef = useRef<string[]>([]);
  selectedIdsRef.current = selectedInvoiceIds;

  // Expose selection to parent via imperative handle
  useImperativeHandle(ref, () => ({
    getSelection: () => ({
      invoiceIds: selectedIdsRef.current,
      totals: calculateTotals(selectedIdsRef.current),
    }),
    hasSelection: () => selectedIdsRef.current.length > 0,
  }), [calculateTotals]);

  // Simple toggle handler - no callbacks, parent reads via ref on submit
  const handleInvoiceToggle = useCallback((invoiceId: string) => {
    setSelectedInvoiceIds(prev =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  }, []);

  // Simple select all handler - no callbacks, parent reads via ref on submit
  const handleSelectAll = useCallback(() => {
    setSelectedInvoiceIds(prev => {
      const currentInvoices = invoicesRef.current;
      return prev.length === currentInvoices.length
        ? []
        : currentInvoices.map((inv) => inv.invoiceId);
    });
  }, []);

  const selectedInvoices = invoices.filter((inv) =>
    selectedInvoiceIds.includes(inv.invoiceId)
  );

  const totalGrossAmount = selectedInvoices.reduce((sum, inv) => sum + inv.grossAmount, 0);
  const totalCommissionAmount = selectedInvoices.reduce((sum, inv) => sum + inv.commissionAmount, 0);
  const totalNetAmount = totalGrossAmount - totalCommissionAmount;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 text-destructive">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Select All */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {t('selectInvoices')}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          disabled={invoices.length === 0}
        >
          {selectedInvoiceIds.length === invoices.length
            ? t('deselectAllInvoices')
            : t('selectAllInvoices')}
        </Button>
      </div>

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/50">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t('noInvoicesAvailable')}
          </p>
        </div>
      ) : (
        <div className="h-[300px] border rounded-lg overflow-y-auto">
          <div className="p-4 space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.invoiceId}
                className={cn(
                  'flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border cursor-pointer transition-colors',
                  selectedInvoiceIds.includes(invoice.invoiceId)
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted'
                )}
                onClick={() => handleInvoiceToggle(invoice.invoiceId)}
              >
                <input
                  type="checkbox"
                  checked={selectedInvoiceIds.includes(invoice.invoiceId)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleInvoiceToggle(invoice.invoiceId)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <Badge variant="outline">
                      {formatCurrency(invoice.commissionAmount)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(invoice.invoiceDate, 'PPP', { locale: dateLocale })}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {t('grossAmount')}: {formatCurrency(invoice.grossAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('commissionPercentage')}: {invoice.commissionPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals Summary */}
      {selectedInvoiceIds.length > 0 && (
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('grossAmount')}</p>
              <p className="text-xl font-bold">{formatCurrency(totalGrossAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('commissionAmount')}</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(totalCommissionAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('netAmount')}</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(totalNetAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{`${selectedInvoiceIds.length} invoice(s) selected`}</p>
              <p className="text-xl font-bold">{selectedInvoiceIds.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        {t('calculatedFromInvoices')}
      </p>
    </div>
  );
}));
