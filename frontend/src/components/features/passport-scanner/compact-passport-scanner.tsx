// Compact Passport Scanner Component
// Space-optimized variant for use in modals
// Smaller preview areas and condensed button layout
// Client-side OCR using Tesseract.js

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Upload, Loader2 } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { PassportScanResult } from '@/types/models/passport';
import { ScanResultPreview } from './scan-result-preview';
import { extractPassportData } from '@/lib/ocr/passport-parser';

interface CompactPassportScannerProps {
  onScanComplete: (result: PassportScanResult) => void;
  onError?: (error: string) => void;
}

export function CompactPassportScanner({
  onScanComplete,
  onError,
}: CompactPassportScannerProps) {
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
        console.log('[CompactPassportScanner] Initializing Tesseract worker...');

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
          console.log('[CompactPassportScanner] Tesseract worker ready');
        } else {
          // Component unmounted during initialization
          await worker.terminate();
        }
      } catch (error) {
        console.error('[CompactPassportScanner] Worker initialization error:', error);
        if (isMounted) {
          onError?.('Failed to initialize OCR engine');
        }
      }
    };

    initWorker();

    return () => {
      isMounted = false;
      if (workerRef.current) {
        console.log('[CompactPassportScanner] Terminating worker...');
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [onError]);

  // Handle file upload with client-side OCR
  const handleFileUpload = useCallback(
    async (file: File) => {
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
        console.log('[CompactPassportScanner] Starting OCR recognition...');
        const startTime = Date.now();

        const { data } = await workerRef.current.recognize(file);
        const ocrTime = Date.now() - startTime;

        console.log('[CompactPassportScanner] OCR completed in', ocrTime, 'ms');
        console.log('[CompactPassportScanner] Confidence:', data.confidence);

        // Extract passport data
        const textLines = data.text.split('\n').filter((line: string) => line.trim());
        const result: PassportScanResult = extractPassportData(
          data.text,
          textLines,
          data.confidence,
          ocrTime
        );

        console.log('[CompactPassportScanner] MRZ detected:', result.mrzDetected);

        // Assess image quality
        result.imageQuality = data.confidence >= 80 ? 'high' : data.confidence >= 50 ? 'medium' : 'low';

        setScanResult(result);
        onScanComplete(result);
      } catch (error) {
        console.error('[CompactPassportScanner] OCR error:', error);
        onError?.('Failed to process passport image');
      } finally {
        setIsScanning(false);
      }
    },
    [workerReady, onScanComplete, onError]
  );

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    console.log('[CompactPassportScanner] Starting camera...');

    try {
      // First, set camera active to render the video element
      setCameraActive(true);

      // Small delay to ensure DOM is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[CompactPassportScanner] Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });

      console.log('[CompactPassportScanner] Camera permission granted, stream:', stream);

      if (!videoRef.current) {
        console.error('[CompactPassportScanner] Video ref is null!');
        setCameraActive(false);
        onError?.('Failed to initialize video element');
        return;
      }

      console.log('[CompactPassportScanner] Setting video srcObject...');
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      // Ensure video plays
      try {
        await videoRef.current.play();
        console.log('[CompactPassportScanner] Video playing successfully');
      } catch (playError) {
        console.error('[CompactPassportScanner] Video play error:', playError);
      }

    } catch (error) {
      console.error('[CompactPassportScanner] Camera access error:', error);
      onError?.('Failed to access camera. Please use file upload instead.');
      setCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    console.log('[CompactPassportScanner] Stopping camera...');
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
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          stopCamera();
          const file = new File([blob], 'passport-capture.jpg', { type: 'image/jpeg' });
          handleFileUpload(file);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  // Reset scanner
  const reset = () => {
    setPreview(null);
    setScanResult(null);
    stopCamera();
  };

  // If we have a scan result, show it
  if (scanResult) {
    return (
      <ScanResultPreview
        result={scanResult}
        previewImage={preview}
        onAutoFill={() => {
          // In modal context, parent will handle auto-fill
          // Just signal completion by calling onScanComplete again
          onScanComplete(scanResult);
        }}
        onReScan={reset}
      />
    );
  }

  // Show initialization loading
  if (!workerReady) {
    return (
      <div className="space-y-3">
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-3 border-2 border-dashed">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <div className="text-center px-4">
            <p className="text-sm font-medium">{t('initializing')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {initProgress > 0 ? `${initProgress}%` : t('pleaseWait')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact Preview or Camera */}
      {cameraActive ? (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            onLoadedMetadata={(e) => {
              console.log('[CompactPassportScanner] Video metadata loaded');
              const video = e.currentTarget;
              video.play().catch(err => console.error('[CompactPassportScanner] Play error:', err));
            }}
            onCanPlay={() => {
              console.log('[CompactPassportScanner] Video can play');
            }}
            onPlay={() => {
              console.log('[CompactPassportScanner] Video is playing');
            }}
            onError={(e) => {
              console.error('[CompactPassportScanner] Video error:', e);
            }}
          />
          <div className="absolute inset-0 border-4 border-dashed border-white/50 m-4 rounded pointer-events-none" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            <Button onClick={capturePhoto} size="sm">
              <Camera className="me-2 h-3 w-3" />
              {t('capture')}
            </Button>
            <Button variant="outline" onClick={stopCamera} size="sm">
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : preview ? (
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <img src={preview} alt="Passport preview" className="w-full h-full object-contain" />
          {isScanning && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 to-purple-600/90 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
              <p className="text-white text-sm font-medium">{t('processing')}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-3 border-2 border-dashed">
          <Camera className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm text-center px-4">
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

      {/* Compact Action buttons */}
      {!cameraActive && !isScanning && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Upload className="me-2 h-3 w-3" />
            {t('uploadImage')}
          </Button>
          <Button onClick={startCamera} size="sm" className="w-full">
            <Camera className="me-2 h-3 w-3" />
            {t('useCamera')}
          </Button>
        </div>
      )}
    </div>
  );
}
