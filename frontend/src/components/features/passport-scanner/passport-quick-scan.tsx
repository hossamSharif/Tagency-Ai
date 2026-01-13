// Passport Quick Scan Component
// Wrapper component for inline passport scanner in customer form
// Integrates PassportScanner + ScanResultPreview + auto-fill logic

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PassportScanner } from './passport-scanner';
import { ScanResultPreview } from './scan-result-preview';
import { PassportScanResult } from '@/types/models/passport';

interface PassportQuickScanProps {
  onAutoFill: (scanResult: PassportScanResult) => void;
  onScanError?: (error: string) => void;
}

export function PassportQuickScan({ onAutoFill, onScanError }: PassportQuickScanProps) {
  const t = useTranslations('passport');
  const [scanResult, setScanResult] = useState<PassportScanResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleScanComplete = (result: PassportScanResult) => {
    setScanResult(result);
  };

  const handleAutoFill = () => {
    if (!scanResult) return;

    setIsAutoFilling(true);
    try {
      onAutoFill(scanResult);
    } finally {
      setTimeout(() => setIsAutoFilling(false), 500);
    }
  };

  const handleReScan = () => {
    setScanResult(null);
    setPreviewImage(null);
  };

  const handleError = (error: string) => {
    onScanError?.(error);
  };

  return (
    <div className="space-y-4">
      {/* Show scanner if no result yet */}
      {!scanResult && (
        <PassportScanner onScanComplete={handleScanComplete} onError={handleError} />
      )}

      {/* Show result preview after scan */}
      {scanResult && (
        <ScanResultPreview
          result={scanResult}
          previewImage={previewImage}
          onAutoFill={handleAutoFill}
          onReScan={handleReScan}
          isAutoFilling={isAutoFilling}
        />
      )}
    </div>
  );
}
