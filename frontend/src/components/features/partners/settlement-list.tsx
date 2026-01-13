'use client';

/**
 * Settlement List Component
 *
 * Displays a list of commission settlements
 */

import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SettlementStatusBadge } from './settlement-status-badge';
import type { CommissionSettlement } from '@/types/models/partner-office';
import {
  MoreVertical,
  Eye,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface SettlementListProps {
  settlements: (CommissionSettlement & { settlementNumber?: string })[];
  loading?: boolean;
  currency: string;
  locale?: string;
  showPartner?: boolean;
  onView?: (settlement: CommissionSettlement) => void;
  onApprove?: (settlement: CommissionSettlement) => void;
  onMarkPaid?: (settlement: CommissionSettlement) => void;
  onDispute?: (settlement: CommissionSettlement) => void;
}

export function SettlementList({
  settlements,
  loading,
  currency,
  locale = 'en',
  showPartner = false,
  onView,
  onApprove,
  onMarkPaid,
  onDispute,
}: SettlementListProps) {
  const isArabic = locale === 'ar';
  const dateLocale = isArabic ? arSA : enUS;

  const formatCurrency = (amount: number) => {
    // Always use 'en-US' locale for English numerals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: { toDate?: () => Date } | Date) => {
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate?.() || new Date();
      return format(date, 'dd MMM yyyy', { locale: dateLocale });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {isArabic ? 'لا توجد تسويات' : 'No settlements found'}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isArabic ? 'رقم التسوية' : 'Settlement #'}</TableHead>
            {showPartner && (
              <TableHead>{isArabic ? 'الشريك' : 'Partner'}</TableHead>
            )}
            <TableHead>{isArabic ? 'الفترة' : 'Period'}</TableHead>
            <TableHead>{isArabic ? 'الفواتير' : 'Invoices'}</TableHead>
            <TableHead className="text-end">
              {isArabic ? 'المبلغ' : 'Amount'}
            </TableHead>
            <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settlements.map((settlement) => (
            <TableRow key={settlement.id}>
              <TableCell className="font-medium">
                {settlement.settlementNumber || settlement.id.slice(0, 8)}
              </TableCell>
              {showPartner && (
                <TableCell>{settlement.partnerOfficeName}</TableCell>
              )}
              <TableCell className="text-sm">
                {formatDate(settlement.periodStart)} -{' '}
                {formatDate(settlement.periodEnd)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {settlement.invoiceIds.length}
                </Badge>
              </TableCell>
              <TableCell className="text-end font-semibold">
                {formatCurrency(settlement.amount)}
              </TableCell>
              <TableCell>
                <SettlementStatusBadge status={settlement.status} locale={locale} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView?.(settlement)}>
                      <Eye className="me-2 h-4 w-4" />
                      {isArabic ? 'عرض التفاصيل' : 'View Details'}
                    </DropdownMenuItem>
                    {settlement.status === 'pending' && (
                      <DropdownMenuItem onClick={() => onApprove?.(settlement)}>
                        <CheckCircle className="me-2 h-4 w-4" />
                        {isArabic ? 'اعتماد' : 'Approve'}
                      </DropdownMenuItem>
                    )}
                    {settlement.status === 'approved' && (
                      <DropdownMenuItem onClick={() => onMarkPaid?.(settlement)}>
                        <DollarSign className="me-2 h-4 w-4" />
                        {isArabic ? 'تسجيل الدفع' : 'Mark as Paid'}
                      </DropdownMenuItem>
                    )}
                    {['pending', 'approved'].includes(settlement.status) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDispute?.(settlement)}
                          className="text-amber-600"
                        >
                          <AlertTriangle className="me-2 h-4 w-4" />
                          {isArabic ? 'اعتراض' : 'Dispute'}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
