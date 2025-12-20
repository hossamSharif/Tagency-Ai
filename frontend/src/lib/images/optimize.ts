/**
 * Image Optimization Utility
 *
 * Provides image optimization and resizing utilities
 * for package cover images and user uploads
 */

// Image size configurations
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 320, height: 240 },
  medium: { width: 640, height: 480 },
  large: { width: 1280, height: 960 },
  cover: { width: 800, height: 600 },
  avatar: { width: 200, height: 200 },
} as const;

export type ImageSizeKey = keyof typeof IMAGE_SIZES;

// Supported image formats
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  avatar: 2 * 1024 * 1024, // 2MB
  cover: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
} as const;

/**
 * Validate image file type
 */
export function isValidImageType(file: File): boolean {
  return SUPPORTED_FORMATS.includes(file.type as SupportedFormat);
}

/**
 * Validate image file size
 */
export function isValidImageSize(file: File, maxSize: number = MAX_FILE_SIZES.cover): boolean {
  return file.size <= maxSize;
}

/**
 * Get image dimensions from a File
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Resize image using Canvas API
 */
export function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Optimize image for upload
 * Resizes and compresses the image if needed
 */
export async function optimizeImage(
  file: File,
  options: {
    size?: ImageSizeKey;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<{ file: File; optimized: boolean }> {
  const { size = 'cover', quality = 0.85 } = options;

  // Use predefined size or custom dimensions
  const dimensions = IMAGE_SIZES[size];
  const maxWidth = options.maxWidth ?? dimensions.width;
  const maxHeight = options.maxHeight ?? dimensions.height;

  // Validate file type
  if (!isValidImageType(file)) {
    throw new Error('Invalid image type. Supported formats: JPEG, PNG, WebP, GIF');
  }

  // Get original dimensions
  const originalDimensions = await getImageDimensions(file);

  // Check if optimization is needed
  const needsResize =
    originalDimensions.width > maxWidth || originalDimensions.height > maxHeight;
  const needsCompression = file.size > MAX_FILE_SIZES.cover;

  if (!needsResize && !needsCompression) {
    return { file, optimized: false };
  }

  // Resize and compress
  const blob = await resizeImage(file, maxWidth, maxHeight, quality);

  // Create new File object
  const optimizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
  });

  return { file: optimizedFile, optimized: true };
}

/**
 * Generate placeholder data URL for lazy loading
 */
export function generatePlaceholder(width: number, height: number, color: string = '#f0f0f0'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect fill="${color}" width="${width}" height="${height}"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Create optimized Next.js Image props
 */
export function getOptimizedImageProps(
  src: string,
  alt: string,
  size: ImageSizeKey = 'cover'
): {
  src: string;
  alt: string;
  width: number;
  height: number;
  placeholder: 'blur' | 'empty';
  blurDataURL: string;
} {
  const dimensions = IMAGE_SIZES[size];

  return {
    src,
    alt,
    width: dimensions.width,
    height: dimensions.height,
    placeholder: 'blur',
    blurDataURL: generatePlaceholder(dimensions.width, dimensions.height),
  };
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(baseUrl: string, widths: number[] = [320, 640, 1280]): string {
  return widths.map((w) => `${baseUrl}?w=${w} ${w}w`).join(', ');
}
