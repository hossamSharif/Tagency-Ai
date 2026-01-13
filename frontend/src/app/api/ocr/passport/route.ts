// OCR API route for passport scanning
// T091 [US2] Create OCR API route

import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import { extractPassportData } from '@/lib/ocr/passport-parser';
import { PassportScanResult } from '@/types/models/passport';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout

// Worker pool - reuse worker across requests for better performance
let workerInstance: Tesseract.Worker | null = null;
let workerInitializing = false;

/**
 * Get or create a reusable Tesseract worker
 */
async function getWorker(): Promise<Tesseract.Worker> {
  // If worker already exists, return it
  if (workerInstance) {
    console.log('[OCR API] Reusing existing worker');
    return workerInstance;
  }

  // If another request is initializing, wait for it
  if (workerInitializing) {
    console.log('[OCR API] Waiting for worker initialization...');
    while (workerInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (workerInstance) {
      return workerInstance;
    }
  }

  // Initialize new worker
  console.log('[OCR API] Creating new worker (first-time initialization)...');
  workerInitializing = true;

  try {
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status) {
          console.log('[Tesseract]', m.status, m.progress ? `${Math.round(m.progress * 100)}%` : '');
        }
      },
    });

    // Configure for MRZ recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789< ',
    });

    workerInstance = worker;
    console.log('[OCR API] Worker initialized and cached');
    return worker;
  } finally {
    workerInitializing = false;
  }
}

/**
 * POST /api/ocr/passport
 * Process a passport image and extract data
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[OCR API] Request received');
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      console.error('[OCR API] No image file provided');
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    console.log('[OCR API] File received:', file.name, file.type, file.size, 'bytes');

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      console.error('[OCR API] Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPEG, PNG, WebP, BMP' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('[OCR API] File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    console.log('[OCR API] Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('[OCR API] Buffer created, size:', buffer.length, 'bytes');

    // Perform OCR with cached worker
    console.log('[OCR API] Getting worker...');
    const worker = await getWorker();
    console.log('[OCR API] Worker ready');

    console.log('[OCR API] Starting OCR recognition...');
    const recognitionStart = Date.now();
    const ocrResult = await worker.recognize(buffer);
    const ocrTime = Date.now() - recognitionStart;
    console.log('[OCR API] OCR completed in', ocrTime, 'ms');
    console.log('[OCR API] Confidence:', ocrResult.data.confidence);

    // Extract passport data from OCR result
    // Handle Tesseract.js v7 response structure - extract lines from text
    console.log('[OCR API] Extracting passport data...');
    const textLines = ocrResult.data.text.split('\n').filter((line: string) => line.trim());
    const result: PassportScanResult = extractPassportData(
      ocrResult.data.text,
      textLines,
      ocrResult.data.confidence,
      ocrTime
    );
    console.log('[OCR API] Data extracted, MRZ detected:', result.mrzDetected);

    // Add image quality assessment
    result.imageQuality = assessImageQuality(ocrResult.data.confidence);

    const totalTime = Date.now() - startTime;
    console.log('[OCR API] Total processing time:', totalTime, 'ms');
    console.log('[OCR API] Returning success response');

    return NextResponse.json({
      success: true,
      data: result,
      processingTime: totalTime,
    });
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error('[OCR API] Processing error:', error);
    console.error('[OCR API] Error occurred after:', errorTime, 'ms');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process passport image',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: errorTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Assess image quality based on OCR confidence
 */
function assessImageQuality(confidence: number): 'low' | 'medium' | 'high' {
  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}

/**
 * GET /api/ocr/passport
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ocr/passport',
    method: 'POST',
    description: 'Extract passport data from an image using OCR',
    request: {
      contentType: 'multipart/form-data',
      body: {
        image: 'File (required) - Passport image in JPEG, PNG, WebP, or BMP format',
      },
    },
    response: {
      success: 'boolean - Whether OCR processing succeeded',
      data: {
        rawText: 'string - Raw OCR text output',
        overallConfidence: 'number - Overall OCR confidence (0-100)',
        mrzDetected: 'boolean - Whether MRZ was detected and parsed',
        mrzData: 'object | null - Parsed MRZ data if detected',
        extractedData: 'object - Extracted passport fields',
        fieldConfidence: 'object - Confidence scores per field',
        processingTime: 'number - Processing time in milliseconds',
        imageQuality: 'string - Image quality assessment (low/medium/high)',
        warnings: 'string[] | undefined - Any warnings during processing',
      },
      processingTime: 'number - Total request processing time',
    },
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'],
    maxFileSize: '10MB',
    notes: [
      'Best results with clear, well-lit passport images',
      'MRZ (Machine Readable Zone) at bottom of passport provides most accurate data',
      'Manual verification is recommended for low confidence results',
    ],
  });
}
