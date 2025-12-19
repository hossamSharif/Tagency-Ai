'use client';

// TravelerForm component
// T115 [US2] Create TravelerForm component

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { User, Camera, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PassportScanner } from '@/components/features/passport-scanner/passport-scanner';
import { PassportDataForm } from '@/components/features/passport-scanner/passport-data-form';
import { PassportPreview } from '@/components/features/passport-scanner/passport-preview';
import { Traveler } from '@/types/models/booking';
import { PassportScanResult, PassportFormData } from '@/types/models/passport';

interface TravelerFormProps {
  traveler: Traveler;
  index: number;
  onUpdate: (index: number, data: Partial<Traveler>) => void;
  onPassportScan: (index: number, passport: PassportFormData) => Promise<void>;
  locale?: 'ar' | 'en';
  isLoading?: boolean;
}

export function TravelerForm({
  traveler,
  index,
  onUpdate,
  onPassportScan,
  locale = 'ar',
  isLoading,
}: TravelerFormProps) {
  const t = useTranslations('bookings');
  const [isEditing, setIsEditing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showPassportForm, setShowPassportForm] = useState(false);
  const [scanResult, setScanResult] = useState<PassportScanResult | null>(null);

  const [firstName, setFirstName] = useState(traveler.firstName);
  const [lastName, setLastName] = useState(traveler.lastName);

  const handleSave = () => {
    onUpdate(index, { firstName, lastName });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFirstName(traveler.firstName);
    setLastName(traveler.lastName);
    setIsEditing(false);
  };

  const handleScanComplete = (result: PassportScanResult) => {
    setScanResult(result);
    setShowScanner(false);
    setShowPassportForm(true);
  };

  const handlePassportSubmit = async (data: PassportFormData) => {
    await onPassportScan(index, data);
    setShowPassportForm(false);
    setScanResult(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          {t('traveler')} {index + 1}
          {traveler.isPrimary && (
            <Badge variant="default" className="text-xs">
              {t('primary')}
            </Badge>
          )}
        </CardTitle>

        {!isEditing && !showScanner && !showPassportForm && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScanner(true)}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {showScanner ? (
          <div className="space-y-4">
            <PassportScanner
              onScanComplete={handleScanComplete}
              onError={(error) => console.error(error)}
            />
            <Button
              variant="outline"
              onClick={() => setShowScanner(false)}
              className="w-full"
            >
              {t('cancel')}
            </Button>
          </div>
        ) : showPassportForm ? (
          <PassportDataForm
            initialData={scanResult || undefined}
            onSubmit={handlePassportSubmit}
            onCancel={() => {
              setShowPassportForm(false);
              setScanResult(null);
            }}
            isLoading={isLoading}
          />
        ) : isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('firstName')}</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label>{t('lastName')}</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="me-1 h-4 w-4" />
                {t('cancel')}
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="me-1 h-4 w-4" />
                {t('save')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {traveler.firstName} {traveler.lastName}
                </p>
              </div>
            </div>

            {traveler.passport ? (
              <PassportPreview passport={traveler.passport} locale={locale} />
            ) : (
              <div className="p-4 border-2 border-dashed rounded-lg text-center">
                <p className="text-muted-foreground text-sm mb-2">
                  {t('noPassportData')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="me-2 h-4 w-4" />
                  {t('scanPassport')}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
