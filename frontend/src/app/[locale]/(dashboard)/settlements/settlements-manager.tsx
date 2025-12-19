'use client';

/**
 * Settlements Manager Component
 *
 * Client component for managing all settlements across partners
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSettlements, useSettlementStats } from '@/hooks/use-settlements';
import { usePartners } from '@/hooks/use-partners';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettlementList } from '@/components/features/partners/settlement-list';
import {
  approveSettlementAction,
  markSettlementPaidAction,
  disputeSettlementAction,
} from '@/app/actions/settlements';
import { useTenant } from '@/hooks/use-tenant';
import type { CommissionSettlement } from '@/types/models/partner-office';
import { Clock, CheckCircle, DollarSign, AlertTriangle, FileText } from 'lucide-react';

interface SettlementsManagerProps {
  locale: string;
}

export function SettlementsManager({ locale }: SettlementsManagerProps) {
  const { toast } = useToast();
  const isArabic = locale === 'ar';
  const { tenant } = useTenant();

  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<CommissionSettlement['status'] | 'all'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { partners } = usePartners({ status: 'active' });
  const { settlements, loading, error, refresh } = useSettlements({
    partnerOfficeId: partnerFilter === 'all' ? undefined : partnerFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 100,
  });
  const stats = useSettlementStats();

  const currency = tenant?.currency || 'SAR';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleApprove = async (settlement: CommissionSettlement) => {
    setIsSubmitting(true);
    try {
      const result = await approveSettlementAction({ settlementId: settlement.id });
      if (result.success) {
        toast({
          title: isArabic ? 'تم الاعتماد' : 'Approved',
          description: isArabic
            ? 'تم اعتماد التسوية بنجاح'
            : 'Settlement approved successfully',
        });
        refresh();
      } else {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (settlement: CommissionSettlement) => {
    setIsSubmitting(true);
    try {
      const result = await markSettlementPaidAction({
        settlementId: settlement.id,
        paymentMethod: 'bank_transfer',
      });
      if (result.success) {
        toast({
          title: isArabic ? 'تم الدفع' : 'Paid',
          description: isArabic
            ? 'تم تسجيل الدفع بنجاح'
            : 'Payment recorded successfully',
        });
        refresh();
      } else {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispute = async (settlement: CommissionSettlement) => {
    const reason = prompt(isArabic ? 'سبب الاعتراض:' : 'Dispute reason:');
    if (!reason) return;

    setIsSubmitting(true);
    try {
      const result = await disputeSettlementAction({
        settlementId: settlement.id,
        reason,
      });
      if (result.success) {
        toast({
          title: isArabic ? 'تم الاعتراض' : 'Disputed',
          description: isArabic
            ? 'تم تسجيل الاعتراض بنجاح'
            : 'Dispute recorded successfully',
        });
        refresh();
      } else {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statCards = [
    {
      title: isArabic ? 'قيد الانتظار' : 'Pending',
      value: stats.pendingCount,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: isArabic ? 'معتمدة' : 'Approved',
      value: stats.approvedCount,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: isArabic ? 'مدفوعة' : 'Paid',
      value: stats.paidCount,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: isArabic ? 'معترض عليها' : 'Disputed',
      value: stats.disputedCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
  ];

  if (loading && !settlements.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Amount Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isArabic ? 'إجمالي قيد الانتظار' : 'Total Pending Amount'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats.totalPendingAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isArabic ? 'إجمالي المدفوع' : 'Total Paid Amount'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaidAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={partnerFilter}
          onValueChange={setPartnerFilter}
        >
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder={isArabic ? 'جميع الشركاء' : 'All Partners'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isArabic ? 'جميع الشركاء' : 'All Partners'}</SelectItem>
            {partners.map((partner) => (
              <SelectItem key={partner.id} value={partner.id}>
                {partner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as CommissionSettlement['status'] | 'all')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</SelectItem>
            <SelectItem value="approved">{isArabic ? 'معتمدة' : 'Approved'}</SelectItem>
            <SelectItem value="paid">{isArabic ? 'مدفوعة' : 'Paid'}</SelectItem>
            <SelectItem value="disputed">{isArabic ? 'معترض عليها' : 'Disputed'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Settlements List */}
      <SettlementList
        settlements={settlements}
        loading={loading}
        currency={currency}
        locale={locale}
        showPartner={partnerFilter === 'all'}
        onApprove={handleApprove}
        onMarkPaid={handleMarkPaid}
        onDispute={handleDispute}
      />
    </div>
  );
}
