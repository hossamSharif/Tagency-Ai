'use client';

// PassportScanner component with camera capture
// T107 [US2] Create PassportScanner component
// Client-side OCR using Tesseract.js

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PassportScanResult } from '@/types/models/passport';
import { extractPassportData } from '@/lib/ocr/passport-parser';

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
  const [workerReady, setWorkerReady] = useState(false);
  const [initProgress, setInitProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);

  // Initialize Tesseract worker on mount
  useEffect(() => {
    let isMounted = true;

    const initWorker = async () => {
      try {
        console.log('[PassportScanner] Initializing Tesseract worker...');

        const worker = await Tesseract.createWorker('eng', 1, {
          logger: (m: any) => {
            if (m.status === 'loading tesseract core' ||
                m.status === 'initializing tesseract' ||
                m.status === 'loading language traineddata') {
              const progress = Math.round((m.progress || 0) * 100);
              console.log(`[Tesseract] ${m.status}: ${progress}%`);
              if (isMounted) {
                setInitProgress(progress);
              }
            }
          },
        });

        // Configure for passport MRZ recognition
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789< ',
        });

        if (isMounted) {
          workerRef.current = worker;
          setWorkerReady(true);
          console.log('[PassportScanner] Tesseract worker ready');
        } else {
          // Component unmounted during initialization
          await worker.terminate();
        }
      } catch (error) {
        console.error('[PassportScanner] Worker initialization error:', error);
        if (isMounted) {
          onError?.('Failed to initialize OCR engine');
        }
      }
    };

    initWorker();

    return () => {
      isMounted = false;
      if (workerRef.current) {
        console.log('[PassportScanner] Terminating worker...');
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [onError]);

  // Handle file upload with client-side OCR
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('Please upload an image file');
      return;
    }

    if (!workerRef.current || !workerReady) {
      onError?.('OCR engine not ready. Please wait...');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Perform client-side OCR
    setIsScanning(true);
    setScanResult(null);

    try {
      console.log('[PassportScanner] Starting OCR recognition...');
      const startTime = Date.now();

      const { data } = await workerRef.current.recognize(file);
      const ocrTime = Date.now() - startTime;

      console.log('[PassportScanner] OCR completed in', ocrTime, 'ms');
      console.log('[PassportScanner] Confidence:', data.confidence);

      // Extract passport data
      const textLines = data.text.split('\n').filter((line: string) => line.trim());
      const result: PassportScanResult = extractPassportData(
        data.text,
        textLines,
        data.confidence,
        ocrTime
      );

      console.log('[PassportScanner] MRZ detected:', result.mrzDetected);

      // Assess image quality
      result.imageQuality = data.confidence >= 80 ? 'high' : data.confidence >= 50 ? 'medium' : 'low';

      // Store the original file for automatic upload
      result.capturedImage = file;

      setScanResult(result);
      onScanComplete(result);
    } catch (error) {
      console.error('[PassportScanner] OCR error:', error);
      onError?.('Failed to process passport image');
    } finally {
      setIsScanning(false);
    }
  }, [workerReady, onScanComplete, onError]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    console.log('[PassportScanner] Starting camera...');

    try {
      // First, set camera active to render the video element
      setCameraActive(true);

      // Small delay to ensure DOM is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[PassportScanner] Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });

      console.log('[PassportScanner] Camera permission granted, stream:', stream);

      if (!videoRef.current) {
        console.error('[PassportScanner] Video ref is null!');
        setCameraActive(false);
        onError?.('Failed to initialize video element');
        return;
      }

      console.log('[PassportScanner] Setting video srcObject...');
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      // Ensure video plays
      try {
        await videoRef.current.play();
        console.log('[PassportScanner] Video playing successfully');
      } catch (playError) {
        console.error('[PassportScanner] Video play error:', playError);
      }

    } catch (error) {
      console.error('[PassportScanner] Camera access error:', error);
      onError?.('Failed to access camera');
      setCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    console.log('[PassportScanner] Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
          {/* Worker initialization loading */}
          {!workerReady && (
            <div className="aspect-[3/2] bg-muted rounded-lg flex flex-col items-center justify-center gap-4 border-2 border-dashed">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-medium">{t('initializing')}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {initProgress > 0 ? `${initProgress}%` : t('pleaseWait')}
                </p>
              </div>
            </div>
          )}

          {/* Preview or Camera */}
          {workerReady && cameraActive ? (
            <div className="relative aspect-[3/2] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
                onLoadedMetadata={(e) => {
                  console.log('[PassportScanner] Video metadata loaded');
                  const video = e.currentTarget;
                  video.play().catch(err => console.error('[PassportScanner] Play error:', err));
                }}
                onCanPlay={() => {
                  console.log('[PassportScanner] Video can play');
                }}
                onPlay={() => {
                  console.log('[PassportScanner] Video is playing');
                }}
                onError={(e) => {
                  console.error('[PassportScanner] Video error:', e);
                }}
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
          ) : workerReady && preview ? (
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
          ) : workerReady && (
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
          {workerReady && !cameraActive && !isScanning && (
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
