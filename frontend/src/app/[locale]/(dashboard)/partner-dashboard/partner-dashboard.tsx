'use client';

/**
 * Partner Dashboard Component
 *
 * Dashboard for partner role users to view their commissions and settlements
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { usePartner } from '@/hooks/use-partners';
import { useMySettlements } from '@/hooks/use-settlements';
import { usePartnerCommissions } from '@/hooks/use-partner-commissions';
import { getDocument } from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CommissionSummary } from '@/components/features/partners/commission-summary';
import { SettlementList } from '@/components/features/partners/settlement-list';
import { SettlementStatusBadge } from '@/components/features/partners/settlement-status-badge';
import { disputeSettlementAction } from '@/app/actions/settlements';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Building2, TrendingUp, Clock, CheckCircle2, FileText } from 'lucide-react';

interface PartnerDashboardProps {
  locale: string;
}

export function PartnerDashboard({ locale }: PartnerDashboardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const isArabic = locale === 'ar';
  const dateLocale = isArabic ? arSA : enUS;

  const [partnerOfficeId, setPartnerOfficeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch partner office ID from user profile
  useEffect(() => {
    if (!user || !tenant?.id) {
      setLoading(false);
      return;
    }

    const fetchPartnerOfficeId = async () => {
      try {
        const userData = await getDocument(tenant.id, 'users', user.uid);
        if (userData?.partnerOfficeId) {
          setPartnerOfficeId(userData.partnerOfficeId);
        }
      } catch (err) {
        console.error('Failed to fetch partner office ID:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerOfficeId();
  }, [user, tenant?.id]);

  const { partner, loading: partnerLoading } = usePartner(partnerOfficeId);
  const { settlements, refresh: refreshSettlements } = useMySettlements();
  const { commissions, loading: commissionsLoading } = usePartnerCommissions({
    partnerOfficeId: partnerOfficeId || '',
    settled: false,
  });

  const currency = partner?.currency || tenant?.currency || 'SAR';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDispute = async (settlement: { id: string }) => {
    const reason = prompt(isArabic ? 'سبب الاعتراض:' : 'Dispute reason:');
    if (!reason || reason.length < 10) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic
          ? 'يجب أن يكون سبب الاعتراض 10 أحرف على الأقل'
          : 'Dispute reason must be at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await disputeSettlementAction({
        settlementId: settlement.id,
        reason,
      });

      if (result.success) {
        toast({
          title: isArabic ? 'تم الاعتراض' : 'Disputed',
          description: isArabic
            ? 'تم تسجيل اعتراضك بنجاح'
            : 'Your dispute has been recorded',
        });
        refreshSettlements();
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
    }
  };

  if (loading || partnerLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!partnerOfficeId || !partner) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {isArabic
            ? 'لا يوجد مكتب شريك مرتبط بحسابك'
            : 'No partner office associated with your account'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Partner Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{partner.name}</h2>
              <p className="text-muted-foreground">{partner.code}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Summary */}
      <CommissionSummary
        partnerOfficeId={partnerOfficeId}
        currency={currency}
        locale={locale}
      />

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            {isArabic ? 'العمولات قيد الانتظار' : 'Pending Commissions'}
          </TabsTrigger>
          <TabsTrigger value="settlements">
            {isArabic ? 'التسويات' : 'Settlements'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {isArabic ? 'العمولات غير المسددة' : 'Unsettled Commissions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {commissionsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : commissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isArabic ? 'لا توجد عمولات غير مسددة' : 'No unsettled commissions'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isArabic ? 'الفاتورة' : 'Invoice'}</TableHead>
                      <TableHead>{isArabic ? 'الخدمة' : 'Service'}</TableHead>
                      <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead className="text-end">
                        {isArabic ? 'مبلغ الخدمة' : 'Service Amount'}
                      </TableHead>
                      <TableHead className="text-end">
                        {isArabic ? 'النسبة' : 'Rate'}
                      </TableHead>
                      <TableHead className="text-end">
                        {isArabic ? 'العمولة' : 'Commission'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission, idx) => (
                      <TableRow key={`${commission.invoiceId}-${commission.serviceId}-${idx}`}>
                        <TableCell className="font-medium">
                          {commission.invoiceNumber}
                        </TableCell>
                        <TableCell>{commission.serviceName}</TableCell>
                        <TableCell>
                          {format(commission.invoiceDate, 'dd MMM yyyy', {
                            locale: dateLocale,
                          })}
                        </TableCell>
                        <TableCell className="text-end">
                          {formatCurrency(commission.serviceAmount)}
                        </TableCell>
                        <TableCell className="text-end">
                          {commission.commissionPercentage}%
                        </TableCell>
                        <TableCell className="text-end font-semibold">
                          {formatCurrency(commission.commissionAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                {isArabic ? 'تاريخ التسويات' : 'Settlement History'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SettlementList
                settlements={settlements}
                currency={currency}
                locale={locale}
                onDispute={handleDispute}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
