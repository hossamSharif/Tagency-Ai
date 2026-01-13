// Custom hook for passport scanning state management
// Provides clean API for passport scanner components

import { useState, useCallback } from 'react';
import { PassportScanResult } from '@/types/models/passport';

interface UsePassportScanReturn {
  scanResult: PassportScanResult | null;
  isScanning: boolean;
  error: string | null;
  handleScan: (file: File) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

export function usePassportScan(): UsePassportScanReturn {
  const [scanResult, setScanResult] = useState<PassportScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP, BMP)');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('Image file is too large. Maximum size is 10MB');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr/passport', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setScanResult(result.data);
      } else {
        setError(result.error || 'OCR processing failed');
      }
    } catch (err) {
      console.error('OCR error:', err);
      setError('Failed to process passport image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setScanResult(null);
    setIsScanning(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    scanResult,
    isScanning,
    error,
    handleScan,
    reset,
    clearError,
  };
}
