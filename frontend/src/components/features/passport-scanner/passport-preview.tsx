'use client';

// PassportPreview component
// T108 [US2] Create PassportPreview component

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { User, Calendar, MapPin, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PassportData } from '@/types/models/customer';
import { Timestamp } from 'firebase/firestore';

interface PassportPreviewProps {
  passport: PassportData;
  locale?: 'ar' | 'en';
}

export function PassportPreview({ passport, locale = 'ar' }: PassportPreviewProps) {
  const t = useTranslations('passport');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'dd MMMM yyyy', { locale: dateLocale });
  };

  const isExpired = passport.expiryDate.toDate() < new Date();
  const isExpiringSoon = !isExpired &&
    passport.expiryDate.toDate() < new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('passportDetails')}
          </div>
          <div className="flex items-center gap-2">
            {passport.manuallyVerified ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="me-1 h-3 w-3" />
                {t('verified')}
              </Badge>
            ) : (
              <Badge variant="secondary">
                {t('unverified')}
              </Badge>
            )}
            {isExpired && (
              <Badge variant="destructive">
                {t('expired')}
              </Badge>
            )}
            {isExpiringSoon && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                <AlertTriangle className="me-1 h-3 w-3" />
                {t('expiringSoon')}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('passportNumber')}</p>
              <p className="font-mono text-lg font-semibold">{passport.passportNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('fullName')}</p>
              <p className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {passport.fullName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('gender')}</p>
              <p className="font-medium">
                {passport.gender === 'M' ? t('male') : t('female')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('dateOfBirth')}</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(passport.dateOfBirth)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('expiryDate')}</p>
              <p className={`font-medium flex items-center gap-2 ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-yellow-600' : ''}`}>
                <Calendar className="h-4 w-4" />
                {formatDate(passport.expiryDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('nationalityAndIssuer')}</p>
              <p className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {passport.nationality} / {passport.issuingCountry}
              </p>
            </div>
          </div>
        </div>

        {passport.extractionConfidence !== undefined && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {t('ocrConfidence')}: {Math.round(passport.extractionConfidence)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
