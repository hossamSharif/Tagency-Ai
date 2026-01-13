'use client';

/**
 * Partner Card Component
 *
 * Displays a summary card for a partner office in the list view
 */

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type PartnerOffice,
  PARTNER_STATUS_INFO,
} from '@/types/models/partner-office';
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Building2,
  Mail,
  Phone,
  Percent,
  DollarSign,
  UserPlus,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface PartnerCardProps {
  partner: PartnerOffice;
  locale: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onInviteUser?: () => void;
  onActivate?: () => void;
  onSuspend?: () => void;
}

export function PartnerCard({
  partner,
  locale,
  onEdit,
  onDelete,
  onInviteUser,
  onActivate,
  onSuspend,
}: PartnerCardProps) {
  const t = useTranslations('partners');
  const isArabic = locale === 'ar';

  const statusInfo = PARTNER_STATUS_INFO[partner.status];

  const formatCurrency = (amount: number) => {
    // Always use 'en-US' locale for English numerals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: partner.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{partner.name}</h3>
              <p className="text-sm text-muted-foreground">{partner.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(partner.status)}>
              {isArabic ? statusInfo.labelAr : statusInfo.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/partners/${partner.id}`}>
                    <Eye className="me-2 h-4 w-4" />
                    {isArabic ? 'عرض التفاصيل' : 'View Details'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="me-2 h-4 w-4" />
                  {isArabic ? 'تعديل' : 'Edit'}
                </DropdownMenuItem>
                {partner.status === 'active' && (
                  <DropdownMenuItem onClick={onInviteUser}>
                    <UserPlus className="me-2 h-4 w-4" />
                    {isArabic ? 'دعوة مستخدم' : 'Invite User'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {partner.status === 'pending' && (
                  <DropdownMenuItem onClick={onActivate}>
                    <CheckCircle className="me-2 h-4 w-4" />
                    {isArabic ? 'تفعيل' : 'Activate'}
                  </DropdownMenuItem>
                )}
                {partner.status === 'active' && (
                  <DropdownMenuItem onClick={onSuspend} className="text-warning">
                    <XCircle className="me-2 h-4 w-4" />
                    {isArabic ? 'إيقاف' : 'Suspend'}
                  </DropdownMenuItem>
                )}
                {partner.status === 'suspended' && (
                  <DropdownMenuItem onClick={onActivate}>
                    <CheckCircle className="me-2 h-4 w-4" />
                    {isArabic ? 'إعادة التفعيل' : 'Reactivate'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {isArabic ? 'حذف' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2 space-y-3">
        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            <span>{partner.email}</span>
          </div>
          {partner.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              <span>{partner.phone}</span>
            </div>
          )}
        </div>

        {/* Commission Rate */}
        <div className="flex items-center gap-1.5 text-sm">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {isArabic ? 'نسبة العمولة الافتراضية:' : 'Default Commission:'}
          </span>
          <span className="font-medium">{partner.defaultCommissionPercentage}%</span>
        </div>

        {/* Commission Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">
              {isArabic ? 'إجمالي العمولات' : 'Total Earned'}
            </p>
            <p className="font-semibold text-sm">
              {formatCurrency(partner.totalCommissionsEarned)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">
              {isArabic ? 'قيد الانتظار' : 'Pending'}
            </p>
            <p className="font-semibold text-sm text-warning">
              {formatCurrency(partner.pendingCommissions)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">
              {isArabic ? 'المدفوع' : 'Paid'}
            </p>
            <p className="font-semibold text-sm text-green-600">
              {formatCurrency(partner.totalCommissionsPaid)}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t">
        <div className="flex items-center justify-between w-full">
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'جهة الاتصال:' : 'Contact:'} {partner.contactPerson}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={`/${locale}/partners/${partner.id}`}>
              {isArabic ? 'عرض التفاصيل' : 'View Details'}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
