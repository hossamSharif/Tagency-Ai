// Scan Result Preview Component
// Displays passport scan results with confidence indicators and action buttons

'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle, AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';
import { PassportScanResult } from '@/types/models/passport';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfidenceBadge } from './confidence-badge';

interface ScanResultPreviewProps {
  result: PassportScanResult;
  previewImage?: string;
  onAutoFill: () => void;
  onReScan: () => void;
  isAutoFilling?: boolean;
}

export function ScanResultPreview({
  result,
  previewImage,
  onAutoFill,
  onReScan,
  isAutoFilling = false,
}: ScanResultPreviewProps) {
  const t = useTranslations('passport');

  const { extractedData, mrzDetected, overallConfidence, fieldConfidence, warnings } = result;

  // Check for low confidence warning
  const hasLowConfidence = overallConfidence < 60;
  const hasVeryLowConfidence = overallConfidence < 30;

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-4">
        {/* Image Preview + Overall Status */}
        <div className="flex gap-4">
          {/* Thumbnail */}
          {previewImage && (
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-muted">
                <img
                  src={previewImage}
                  alt="Passport preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="flex-1 space-y-2">
            {/* MRZ Detection Status */}
            <div className="flex items-center gap-2">
              {mrzDetected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {t('mrzDetected')}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {t('mrzNotDetected')}
                  </span>
                </>
              )}
            </div>

            {/* Overall Confidence */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('confidence')}:</span>
              <ConfidenceBadge confidence={overallConfidence} />
            </div>
          </div>
        </div>

        {/* Field-Level Confidence */}
        {extractedData && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('extractedFields')}</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {/* Name */}
              {(extractedData.firstName || extractedData.fullName) && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('name')}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {extractedData.firstName && extractedData.lastName
                        ? `${extractedData.firstName} ${extractedData.lastName}`
                        : extractedData.fullName}
                    </span>
                    {fieldConfidence?.fullName !== undefined && (
                      <ConfidenceBadge
                        confidence={fieldConfidence.fullName}
                        showIcon={false}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Passport Number */}
              {extractedData.passportNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('passportNumber')}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">
                      {extractedData.passportNumber}
                    </span>
                    {fieldConfidence?.passportNumber !== undefined && (
                      <ConfidenceBadge
                        confidence={fieldConfidence.passportNumber}
                        showIcon={false}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Nationality */}
              {extractedData.nationality && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('nationality')}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{extractedData.nationality}</span>
                    {fieldConfidence?.nationality !== undefined && (
                      <ConfidenceBadge
                        confidence={fieldConfidence.nationality}
                        showIcon={false}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {(hasLowConfidence || (warnings && warnings.length > 0)) && (
          <Alert variant={hasVeryLowConfidence ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {hasVeryLowConfidence ? (
                <p>{t('veryLowConfidenceWarning')}</p>
              ) : hasLowConfidence ? (
                <p>{t('lowConfidenceWarning')}</p>
              ) : null}
              {warnings && warnings.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs space-y-1">
                  {warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onAutoFill}
            disabled={isAutoFilling || hasVeryLowConfidence}
            className="flex-1 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {t('autoFill')}
          </Button>
          <Button onClick={onReScan} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {t('reScan')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
