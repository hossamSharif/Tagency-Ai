'use client';

/**
 * Partner List Component (Page Level)
 *
 * Client component for displaying and managing partners list
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { usePartners } from '@/hooks/use-partners';
import { PartnerCard } from '@/components/features/partners/partner-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  updatePartnerStatusAction,
  invitePartnerUserAction,
  deletePartnerAction,
} from '@/app/actions/partners';
import type { PartnerOffice, PartnerOfficeStatus } from '@/types/models/partner-office';
import { Building2, Search } from 'lucide-react';

interface PartnerListProps {
  locale: string;
}

export function PartnerList({ locale }: PartnerListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isArabic = locale === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerOfficeStatus | 'all'>('all');
  const [deletePartner, setDeletePartner] = useState<PartnerOffice | null>(null);
  const [invitePartner, setInvitePartner] = useState<PartnerOffice | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { partners, loading, error, refresh } = usePartners({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
    limit: 100,
  });

  const handleEdit = (partner: PartnerOffice) => {
    router.push(`/${locale}/partners/${partner.id}/edit`);
  };

  const handleStatusChange = async (partnerId: string, newStatus: PartnerOfficeStatus) => {
    setIsSubmitting(true);
    try {
      const result = await updatePartnerStatusAction({ partnerId, status: newStatus });
      if (result.success) {
        toast({
          title: isArabic ? 'تم التحديث' : 'Updated',
          description: isArabic
            ? 'تم تحديث حالة الشريك بنجاح'
            : 'Partner status updated successfully',
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

  const handleDelete = async () => {
    if (!deletePartner) return;

    setIsSubmitting(true);
    try {
      const result = await deletePartnerAction(deletePartner.id);
      if (result.success) {
        toast({
          title: isArabic ? 'تم الحذف' : 'Deleted',
          description: isArabic
            ? 'تم حذف الشريك بنجاح'
            : 'Partner deleted successfully',
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
      setDeletePartner(null);
    }
  };

  const handleInviteUser = async () => {
    if (!invitePartner || !inviteEmail || !inviteName) return;

    setIsSubmitting(true);
    try {
      const result = await invitePartnerUserAction({
        partnerId: invitePartner.id,
        email: inviteEmail,
        name: inviteName,
      });
      if (result.success) {
        toast({
          title: isArabic ? 'تم الإرسال' : 'Sent',
          description: isArabic
            ? 'تم إرسال الدعوة بنجاح'
            : 'Invitation sent successfully',
        });
        setInvitePartner(null);
        setInviteEmail('');
        setInviteName('');
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

  if (error) {
    return (
      <EmptyState
        icon={Building2}
        title={isArabic ? 'حدث خطأ' : 'Error Occurred'}
        description={error.message}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isArabic ? 'بحث عن شريك...' : 'Search partners...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as PartnerOfficeStatus | 'all')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="active">{isArabic ? 'نشط' : 'Active'}</SelectItem>
            <SelectItem value="pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</SelectItem>
            <SelectItem value="suspended">{isArabic ? 'موقوف' : 'Suspended'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Partner Cards */}
      {partners.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={isArabic ? 'لا يوجد شركاء' : 'No Partners'}
          description={
            isArabic
              ? 'لم يتم إضافة أي شركاء بعد'
              : 'No partners have been added yet'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              locale={locale}
              onEdit={() => handleEdit(partner)}
              onDelete={() => setDeletePartner(partner)}
              onInviteUser={() => setInvitePartner(partner)}
              onActivate={() => handleStatusChange(partner.id, 'active')}
              onSuspend={() => handleStatusChange(partner.id, 'suspended')}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePartner} onOpenChange={() => setDeletePartner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? `هل أنت متأكد من حذف الشريك "${deletePartner?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to delete "${deletePartner?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting
                ? isArabic ? 'جاري الحذف...' : 'Deleting...'
                : isArabic ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite User Dialog */}
      <Dialog open={!!invitePartner} onOpenChange={() => setInvitePartner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isArabic ? 'دعوة مستخدم جديد' : 'Invite New User'}
            </DialogTitle>
            <DialogDescription>
              {isArabic
                ? `دعوة مستخدم للوصول إلى لوحة تحكم الشريك "${invitePartner?.name}"`
                : `Invite a user to access the partner dashboard for "${invitePartner?.name}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">
                {isArabic ? 'الاسم' : 'Name'}
              </Label>
              <Input
                id="invite-name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder={isArabic ? 'أحمد محمد' : 'Ahmed Mohammed'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInvitePartner(null)}
              disabled={isSubmitting}
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={isSubmitting || !inviteEmail || !inviteName}
            >
              {isSubmitting
                ? isArabic ? 'جاري الإرسال...' : 'Sending...'
                : isArabic ? 'إرسال الدعوة' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
