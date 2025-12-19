'use client';

// PassportScanner component with camera capture
// T107 [US2] Create PassportScanner component

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PassportScanResult } from '@/types/models/passport';

interface PassportScannerProps {
  onScanComplete: (result: PassportScanResult) => void;
  onError?: (error: string) => void;
}

export function PassportScanner({ onScanComplete, onError }: PassportScannerProps) {
  const t = useTranslations('passport');
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<PassportScanResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('Please upload an image file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Send to OCR API
    setIsScanning(true);
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
        onScanComplete(result.data);
      } else {
        onError?.(result.error || 'OCR processing failed');
      }
    } catch (error) {
      console.error('OCR error:', error);
      onError?.('Failed to process passport image');
    } finally {
      setIsScanning(false);
    }
  }, [onScanComplete, onError]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      onError?.('Failed to access camera');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to blob and process
    canvas.toBlob(async (blob) => {
      if (blob) {
        stopCamera();
        const file = new File([blob], 'passport-capture.jpg', { type: 'image/jpeg' });
        handleFileUpload(file);
      }
    }, 'image/jpeg', 0.95);
  };

  // Reset scanner
  const reset = () => {
    setPreview(null);
    setScanResult(null);
    stopCamera();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {t('scanPassport')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Preview or Camera */}
          {cameraActive ? (
            <div className="relative aspect-[3/2] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-dashed border-white/50 m-8 rounded pointer-events-none" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <Button onClick={capturePhoto} size="lg">
                  <Camera className="me-2 h-4 w-4" />
                  {t('capture')}
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : preview ? (
            <div className="relative aspect-[3/2] bg-muted rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Passport preview"
                className="w-full h-full object-contain"
              />
              {isScanning && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>{t('processing')}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[3/2] bg-muted rounded-lg flex flex-col items-center justify-center gap-4 border-2 border-dashed">
              <Camera className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                {t('uploadOrCapture')}
              </p>
            </div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Action buttons */}
          {!cameraActive && !isScanning && (
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Upload className="me-2 h-4 w-4" />
                {t('uploadImage')}
              </Button>
              <Button onClick={startCamera} className="flex-1">
                <Camera className="me-2 h-4 w-4" />
                {t('useCamera')}
              </Button>
            </div>
          )}

          {/* Scan result summary */}
          {scanResult && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                {scanResult.mrzDetected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium">
                  {scanResult.mrzDetected
                    ? t('mrzDetected')
                    : t('mrzNotDetected')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('confidence')}: {Math.round(scanResult.overallConfidence)}%
              </p>
              {scanResult.warnings && scanResult.warnings.length > 0 && (
                <div className="text-sm text-yellow-600">
                  {scanResult.warnings.map((warning, i) => (
                    <p key={i}>{warning}</p>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={reset}>
                {t('scanAnother')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
