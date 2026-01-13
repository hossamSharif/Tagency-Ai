'use client';

// ServiceListClient - Client wrapper for ServiceList
// Handles delete confirmation and state management

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ServiceList } from './service-list';
import { deleteServiceCatalogItem } from '@/app/actions/services-catalog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ServiceCatalogItem } from '@/types/models/service-catalog';

interface ServiceListClientProps {
  services: ServiceCatalogItem[];
  locale: 'ar' | 'en';
}

export function ServiceListClient({ services, locale }: ServiceListClientProps) {
  const t = useTranslations('services');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const handleEdit = (service: ServiceCatalogItem) => {
    router.push(`/${locale}/services/${service.id}`);
  };

  const handleDeleteClick = (serviceId: string) => {
    setServiceToDelete(serviceId);
  };

  const handleDeleteConfirm = () => {
    if (!serviceToDelete) return;

    startTransition(async () => {
      const result = await deleteServiceCatalogItem(serviceToDelete);

      if (result.success) {
        toast.success(
          locale === 'ar'
            ? 'تم تعطيل الخدمة بنجاح'
            : 'Service deactivated successfully'
        );
        router.refresh();
      } else {
        toast.error(result.error || tCommon('errors.general'));
      }

      setServiceToDelete(null);
    });
  };

  return (
    <>
      <ServiceList
        services={services}
        locale={locale}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {tCommon('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
