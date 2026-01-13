'use client';

// CustomerCard component
// T111 [US2] Create CustomerCard component

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  MoreVertical,
  Eye,
  Pencil,
  Trash,
} from 'lucide-react';
import { useTenant } from '@/hooks/use-tenant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Customer } from '@/types/models/customer';

interface CustomerCardProps {
  customer: Customer;
  locale?: 'ar' | 'en';
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CustomerCard({
  customer,
  locale = 'ar',
  onEdit,
  onDelete,
}: CustomerCardProps) {
  const t = useTranslations('customers');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const formatDate = (timestamp: string | { toDate?: () => Date } | Date) => {
    try {
      let date: Date;
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else {
        return 'N/A';
      }
      return format(date, 'dd MMM yyyy', { locale: dateLocale });
    } catch {
      return 'N/A';
    }
  };

  const { tenant } = useTenant();
  const formatCurrency = (amount: number) => {
    // Always use 'en-US' locale for English numerals, use tenant's currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: tenant?.currency || 'SAR',
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {customer.firstName} {customer.lastName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('since')} {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/customers/${customer.id}`}>
                <Eye className="me-2 h-4 w-4" />
                {t('view')}
              </Link>
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="me-2 h-4 w-4" />
                {t('edit')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="me-2 h-4 w-4" />
                {t('delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{customer.email}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span dir="ltr">{customer.phone}</span>
        </div>

        {customer.nationality && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{customer.nationality}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {customer.passport ? (
              <Badge variant="default" className="bg-green-500">
                <CreditCard className="me-1 h-3 w-3" />
                {t('hasPassport')}
              </Badge>
            ) : (
              <Badge variant="secondary">
                <CreditCard className="me-1 h-3 w-3" />
                {t('noPassport')}
              </Badge>
            )}

            {customer.documents && customer.documents.length > 0 && (
              <Badge variant="outline">
                <FileText className="me-1 h-3 w-3" />
                {customer.documents.length} {t('documents')}
              </Badge>
            )}
          </div>

          <div className="text-end">
            <p className="text-xs text-muted-foreground">{t('balance')}</p>
            <p
              className={`font-medium ${
                customer.balance > 0
                  ? 'text-green-600'
                  : customer.balance < 0
                  ? 'text-red-600'
                  : ''
              }`}
            >
              {formatCurrency(customer.balance)}
            </p>
          </div>
        </div>

        {customer.tags && customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {customer.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
