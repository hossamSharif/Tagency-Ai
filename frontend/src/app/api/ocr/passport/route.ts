// OCR API route for passport scanning
// T091 [US2] Create OCR API route

import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import { extractPassportData } from '@/lib/ocr/passport-parser';
import { PassportScanResult } from '@/types/models/passport';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout

/**
 * POST /api/ocr/passport
 * Process a passport image and extract data
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPEG, PNG, WebP, BMP' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Perform OCR
    const worker = await Tesseract.createWorker('eng');

    // Configure for MRZ recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789< ',
    });

    const ocrResult = await worker.recognize(buffer);
    const ocrTime = Date.now() - startTime;

    await worker.terminate();

    // Extract passport data from OCR result
    const lines = ocrResult.data.lines.map((line) => line.text);
    const result: PassportScanResult = extractPassportData(
      ocrResult.data.text,
      lines,
      ocrResult.data.confidence,
      ocrTime
    );

    // Add image quality assessment
    result.imageQuality = assessImageQuality(ocrResult.data.confidence);

    return NextResponse.json({
      success: true,
      data: result,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('OCR processing error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process passport image',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
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
