'use client';

/**
 * Partner Details Component
 *
 * Displays full partner information with commissions and settlements
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { usePartner } from '@/hooks/use-partners';
import { useSettlements } from '@/hooks/use-settlements';
import { usePartnerCommissions } from '@/hooks/use-partner-commissions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PartnerStatusBadge } from '@/components/features/partners/partner-status-badge';
import { CommissionSummary } from '@/components/features/partners/commission-summary';
import { SettlementForm } from '@/components/features/partners/settlement-form';
import { SettlementList } from '@/components/features/partners/settlement-list';
import { createSettlementAction, approveSettlementAction, markSettlementPaidAction } from '@/app/actions/settlements';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Building2,
  Mail,
  Phone,
  Percent,
  Landmark,
  Plus,
  FileText,
} from 'lucide-react';

interface PartnerDetailsProps {
  partnerId: string;
  locale: string;
}

export function PartnerDetails({ partnerId, locale }: PartnerDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isArabic = locale === 'ar';
  const dateLocale = isArabic ? arSA : enUS;

  const { partner, loading, error, refresh: refreshPartner } = usePartner(partnerId);
  const { settlements, refresh: refreshSettlements } = useSettlements({ partnerOfficeId: partnerId });
  const { commissions, loading: commissionsLoading } = usePartnerCommissions({
    partnerOfficeId: partnerId,
    settled: false,
  });

  const [showSettlementForm, setShowSettlementForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount: number) => {
    if (!partner) return '';
    return new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: partner.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateSettlement = async (data: Parameters<typeof createSettlementAction>[0] & { selectedCommissions: unknown[] }) => {
    setIsSubmitting(true);
    try {
      const { selectedCommissions, ...settlementData } = data;
      const result = await createSettlementAction(settlementData);

      if (result.success) {
        toast({
          title: isArabic ? 'تم بنجاح' : 'Success',
          description: isArabic
            ? 'تم إنشاء التسوية بنجاح'
            : 'Settlement created successfully',
        });
        setShowSettlementForm(false);
        refreshSettlements();
        refreshPartner();
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

  const handleApproveSettlement = async (settlement: { id: string }) => {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (settlement: { id: string }) => {
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
        refreshSettlements();
        refreshPartner();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isArabic ? 'لم يتم العثور على الشريك' : 'Partner not found'}
        </p>
        <Button asChild className="mt-4">
          <Link href={`/${locale}/partners`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {isArabic ? 'العودة للشركاء' : 'Back to Partners'}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/partners`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{partner.name}</h1>
                <PartnerStatusBadge status={partner.status} locale={locale} />
              </div>
              <p className="text-muted-foreground">{partner.code}</p>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/${locale}/partners/${partnerId}/edit`}>
            <Edit className="me-2 h-4 w-4" />
            {isArabic ? 'تعديل' : 'Edit'}
          </Link>
        </Button>
      </div>

      {/* Commission Summary */}
      <CommissionSummary
        partnerOfficeId={partnerId}
        currency={partner.currency}
        locale={locale}
      />

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">
            {isArabic ? 'التفاصيل' : 'Details'}
          </TabsTrigger>
          <TabsTrigger value="commissions">
            {isArabic ? 'العمولات' : 'Commissions'}
          </TabsTrigger>
          <TabsTrigger value="settlements">
            {isArabic ? 'التسويات' : 'Settlements'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {isArabic ? 'معلومات الاتصال' : 'Contact Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? 'جهة الاتصال' : 'Contact Person'}
                  </p>
                  <p className="font-medium">{partner.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                  </p>
                  <p className="font-medium">{partner.email}</p>
                </div>
                {partner.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'الهاتف' : 'Phone'}
                    </p>
                    <p className="font-medium">{partner.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  {isArabic ? 'إعدادات العمولة' : 'Commission Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? 'نسبة العمولة الافتراضية' : 'Default Commission Rate'}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {partner.defaultCommissionPercentage}%
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'العمولات قيد الانتظار' : 'Pending'}
                    </p>
                    <p className="font-semibold text-amber-600">
                      {formatCurrency(partner.pendingCommissions)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'إجمالي المدفوع' : 'Total Paid'}
                    </p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(partner.totalCommissionsPaid)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            {partner.bankAccount && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5" />
                    {isArabic ? 'التفاصيل البنكية' : 'Bank Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'اسم البنك' : 'Bank Name'}
                      </p>
                      <p className="font-medium">{partner.bankAccount.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'صاحب الحساب' : 'Account Holder'}
                      </p>
                      <p className="font-medium">{partner.bankAccount.accountHolder}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'رقم الحساب' : 'Account Number'}
                      </p>
                      <p className="font-medium">{partner.bankAccount.accountNumber}</p>
                    </div>
                    {partner.bankAccount.iban && (
                      <div>
                        <p className="text-sm text-muted-foreground">IBAN</p>
                        <p className="font-medium">{partner.bankAccount.iban}</p>
                      </div>
                    )}
                    {partner.bankAccount.swiftCode && (
                      <div>
                        <p className="text-sm text-muted-foreground">SWIFT</p>
                        <p className="font-medium">{partner.bankAccount.swiftCode}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
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
          <div className="flex justify-end">
            <Button onClick={() => setShowSettlementForm(true)}>
              <Plus className="me-2 h-4 w-4" />
              {isArabic ? 'إنشاء تسوية' : 'Create Settlement'}
            </Button>
          </div>

          <SettlementList
            settlements={settlements}
            currency={partner.currency}
            locale={locale}
            onApprove={handleApproveSettlement}
            onMarkPaid={handleMarkPaid}
          />
        </TabsContent>
      </Tabs>

      {/* Settlement Form Dialog */}
      <Dialog open={showSettlementForm} onOpenChange={setShowSettlementForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isArabic ? 'إنشاء تسوية جديدة' : 'Create New Settlement'}
            </DialogTitle>
          </DialogHeader>
          <SettlementForm
            partnerOfficeId={partnerId}
            partnerOfficeName={partner.name}
            currency={partner.currency}
            onSubmit={handleCreateSettlement}
            isLoading={isSubmitting}
            locale={locale}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
