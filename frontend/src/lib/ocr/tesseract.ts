// Tesseract.js wrapper for passport OCR
// T089 [US2] Create Tesseract.js wrapper

import Tesseract from 'tesseract.js';

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface OCROptions {
  languages?: string[];
  onProgress?: (progress: OCRProgress) => void;
}

const DEFAULT_LANGUAGES = ['eng', 'ara'];

/**
 * Initialize a Tesseract worker with specified languages
 */
export async function createWorker(
  languages: string[] = DEFAULT_LANGUAGES,
  onProgress?: (progress: OCRProgress) => void
): Promise<Tesseract.Worker> {
  const worker = await Tesseract.createWorker(languages.join('+'), 1, {
    logger: onProgress
      ? (m) => {
          if (m.status && typeof m.progress === 'number') {
            onProgress({
              status: m.status,
              progress: m.progress,
            });
          }
        }
      : undefined,
  });

  return worker;
}

/**
 * Perform OCR on an image file or URL
 */
export async function recognizeText(
  image: File | string | Blob,
  options: OCROptions = {}
): Promise<{
  text: string;
  confidence: number;
  words: Tesseract.Word[];
  lines: Tesseract.Line[];
}> {
  const { languages = DEFAULT_LANGUAGES, onProgress } = options;
  const worker = await createWorker(languages, onProgress);

  try {
    const result = await worker.recognize(image);

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words,
      lines: result.data.lines,
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Perform OCR optimized for passport MRZ (Machine Readable Zone)
 * Uses specific configurations for better MRZ recognition
 */
export async function recognizePassport(
  image: File | string | Blob,
  onProgress?: (progress: OCRProgress) => void
): Promise<{
  text: string;
  confidence: number;
  lines: string[];
}> {
  const worker = await createWorker(['eng'], onProgress);

  try {
    // Configure for MRZ recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    });

    const result = await worker.recognize(image);

    // Extract lines from the OCR result
    const lines = result.data.lines.map((line) => line.text.trim());

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      lines,
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Check if an image is suitable for OCR (basic quality check)
 */
export function checkImageQuality(
  file: File
): Promise<'low' | 'medium' | 'high'> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;
      const megapixels = (width * height) / 1000000;

      if (megapixels < 1) {
        resolve('low');
      } else if (megapixels < 3) {
        resolve('medium');
      } else {
        resolve('high');
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('low');
    };

    img.src = url;
  });
}

/**
 * Preprocess image for better OCR results (client-side)
 * Returns a canvas with enhanced image
 */
export async function preprocessImage(
  file: File
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Increase contrast
        const contrast = 1.5;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
        const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

        // Apply threshold for binarization (helps with MRZ)
        const threshold = 128;
        const binary = newGray > threshold ? 255 : 0;

        data[i] = binary;
        data[i + 1] = binary;
        data[i + 2] = binary;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create blob from canvas'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };

    img.src = url;
  });
}
