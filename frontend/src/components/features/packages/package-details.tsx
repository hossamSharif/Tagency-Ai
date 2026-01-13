'use client';

/**
 * Package Details Component
 *
 * Displays full package information with services
 */

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updatePackageStatusAction, deletePackageAction, duplicatePackageAction } from '@/app/actions/packages';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ServiceFormDialog } from '@/components/forms/service-form';
import {
  PackageWithServices,
  PACKAGE_STATUS_INFO,
  PACKAGE_TYPE_INFO,
  DOCUMENT_TYPE_INFO,
} from '@/types/models/package';
import { SERVICE_CATEGORY_INFO } from '@/types/models/service';
import { CURRENCIES } from '@/types/models/tenant';
import {
  Calendar,
  Users,
  Clock,
  Plus,
  Edit,
  Trash2,
  Plane,
  Hotel,
  FileText,
  Bus,
  User,
  Utensils,
  Package,
} from 'lucide-react';

interface PackageDetailsProps {
  package: PackageWithServices;
  locale: string;
}

const CATEGORY_ICONS: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Hotel,
  visa: FileText,
  transport: Bus,
  guide: User,
  meal: Utensils,
  other: Package,
};

export function PackageDetails({ package: pkg, locale }: PackageDetailsProps) {
  const t = useTranslations('packages');
  const router = useRouter();
  const isArabic = locale === 'ar';
  const dateLocale = isArabic ? arSA : enUS;
  const [isPending, startTransition] = useTransition();

  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<typeof pkg.services[0] | undefined>();

  const handlePublish = () => {
    startTransition(async () => {
      const result = await updatePackageStatusAction({
        packageId: pkg.id,
        status: 'active',
      });
      if (result.success) {
        toast.success(isArabic ? 'تم نشر الباقة بنجاح' : 'Package published successfully');
        router.refresh();
      } else {
        toast.error(result.error || (isArabic ? 'فشل في نشر الباقة' : 'Failed to publish package'));
      }
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await duplicatePackageAction({ packageId: pkg.id });
      if (result.success && result.data?.packageId) {
        toast.success(isArabic ? 'تم نسخ الباقة بنجاح' : 'Package duplicated successfully');
        router.push(`/${locale}/packages/${result.data.packageId}`);
      } else {
        const errorMessage = !result.success ? result.error : (isArabic ? 'فشل في نسخ الباقة' : 'Failed to duplicate package');
        toast.error(errorMessage || (isArabic ? 'فشل في نسخ الباقة' : 'Failed to duplicate package'));
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الباقة؟' : 'Are you sure you want to delete this package?')) {
      return;
    }
    startTransition(async () => {
      const result = await deletePackageAction(pkg.id);
      if (result.success) {
        toast.success(isArabic ? 'تم حذف الباقة بنجاح' : 'Package deleted successfully');
        router.push(`/${locale}/packages`);
      } else {
        toast.error(result.error || (isArabic ? 'فشل في حذف الباقة' : 'Failed to delete package'));
      }
    });
  };

  const statusInfo = PACKAGE_STATUS_INFO[pkg.status];
  const typeInfo = PACKAGE_TYPE_INFO[pkg.type];
  const currencyInfo = CURRENCIES[pkg.currency];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: pkg.currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (timestamp: string | Date | { toDate: () => Date } | null | undefined) => {
    try {
      if (!timestamp) return '-';

      let date: Date;
      if (typeof timestamp === 'string') {
        // ISO string from server serialization
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else {
        return '-';
      }

      if (isNaN(date.getTime())) return '-';

      return format(date, 'dd MMM yyyy', { locale: dateLocale });
    } catch {
      return '-';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Package Info Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={getStatusBadgeVariant(pkg.status)}>
                  {isArabic ? statusInfo.labelAr : statusInfo.label}
                </Badge>
                <Badge variant="outline">
                  {isArabic ? typeInfo.labelAr : typeInfo.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cover Image */}
            {pkg.coverImage && (
              <div className="rounded-lg overflow-hidden h-48">
                <img
                  src={pkg.coverImage}
                  alt={pkg.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            {pkg.description && (
              <div>
                <h3 className="font-medium mb-2">{t('fields.description')}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {pkg.description}
                </p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('fields.startDate')}</p>
                  <p className="font-medium">{formatDate(pkg.startDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('fields.endDate')}</p>
                  <p className="font-medium">{formatDate(pkg.endDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('fields.duration')}</p>
                  <p className="font-medium">
                    {pkg.duration} {t('fields.days')}
                  </p>
                </div>
              </div>
            </div>

            {/* Capacity */}
            {pkg.maxCapacity && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('fields.maxCapacity')}</p>
                  <p className="font-medium">
                    {pkg.currentBookings} / {pkg.maxCapacity} {isArabic ? 'حجز' : 'bookings'}
                  </p>
                </div>
              </div>
            )}

            {/* Required Documents */}
            {pkg.requiredDocuments && pkg.requiredDocuments.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">
                  {isArabic ? 'المستندات المطلوبة' : 'Required Documents'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pkg.requiredDocuments.map((doc) => (
                    <Badge key={doc} variant="outline">
                      {isArabic
                        ? DOCUMENT_TYPE_INFO[doc].labelAr
                        : DOCUMENT_TYPE_INFO[doc].label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('services.title')}</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingService(undefined);
                  setServiceFormOpen(true);
                }}
              >
                <Plus className="me-2 h-4 w-4" />
                {t('services.add')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pkg.services.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('services.noServices')}
              </p>
            ) : (
              <div className="space-y-4">
                {pkg.services.map((service) => {
                  const categoryInfo = SERVICE_CATEGORY_INFO[service.category];
                  const CategoryIcon = CATEGORY_ICONS[service.category] || Package;

                  return (
                    <div
                      key={service.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{service.name}</p>
                          {service.isOutsourced && (
                            <Badge variant="secondary" className="text-xs">
                              {isArabic ? 'خارجي' : 'Outsourced'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isArabic ? categoryInfo.labelAr : categoryInfo.label}
                          {service.provider && ` • ${service.provider}`}
                        </p>
                      </div>

                      <div className="text-end">
                        <p className="font-semibold">{formatPrice(service.price)}</p>
                        {service.isOutsourced && service.commissionPercentage && (
                          <p className="text-xs text-muted-foreground">
                            {service.commissionPercentage}% {isArabic ? 'عمولة' : 'commission'}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingService(service);
                            setServiceFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Pricing Card */}
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'التسعير' : 'Pricing'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('fields.basePrice')}</span>
              <span className="font-medium">{formatPrice(pkg.basePrice)}</span>
            </div>

            {pkg.services.length > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('services.title')} ({pkg.services.length})
                  </span>
                  <span className="font-medium">
                    {formatPrice(
                      pkg.services.reduce((sum, s) => sum + s.price, 0)
                    )}
                  </span>
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-between text-lg">
              <span className="font-semibold">{t('fields.totalPrice')}</span>
              <span className="font-bold text-primary">
                {formatPrice(pkg.totalPrice)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'الإجراءات' : 'Actions'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pkg.status === 'draft' && (
              <Button className="w-full" variant="default" onClick={handlePublish} disabled={isPending}>
                {isPending ? (isArabic ? 'جاري النشر...' : 'Publishing...') : (isArabic ? 'نشر الباقة' : 'Publish Package')}
              </Button>
            )}
            <Button className="w-full" variant="outline" onClick={handleDuplicate} disabled={isPending}>
              {isPending ? (isArabic ? 'جاري النسخ...' : 'Duplicating...') : t('duplicate')}
            </Button>
            {pkg.currentBookings === 0 && (
              <Button className="w-full" variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? (isArabic ? 'جاري الحذف...' : 'Deleting...') : t('delete')}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Form Dialog */}
      <ServiceFormDialog
        locale={locale}
        packageId={pkg.id}
        mode={editingService ? 'edit' : 'add'}
        service={editingService}
        open={serviceFormOpen}
        onOpenChange={setServiceFormOpen}
        onSuccess={() => {
          // Refresh the page or refetch data
          window.location.reload();
        }}
      />
    </div>
  );
}
