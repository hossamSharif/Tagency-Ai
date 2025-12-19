import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  UploadTask,
  UploadTaskSnapshot,
  StorageReference,
  FullMetadata,
} from 'firebase/storage';
import { storage } from './config';

/**
 * Allowed file types for upload
 */
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'image/jpeg', 'image/png'],
  all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
};

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Get a storage reference for a tenant's file
 */
export function getTenantStorageRef(tenantId: string, path: string): StorageReference {
  return ref(storage, `tenants/${tenantId}/${path}`);
}

/**
 * Upload a file to a tenant's storage
 */
export async function uploadFile(
  tenantId: string,
  path: string,
  file: File | Blob,
  metadata?: { contentType?: string; customMetadata?: Record<string, string> }
): Promise<string> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const storageRef = getTenantStorageRef(tenantId, path);
  const uploadMetadata = {
    contentType: metadata?.contentType || (file instanceof File ? file.type : 'application/octet-stream'),
    customMetadata: metadata?.customMetadata,
  };

  await uploadBytes(storageRef, file, uploadMetadata);
  return getDownloadURL(storageRef);
}

/**
 * Upload a file with progress tracking
 */
export function uploadFileWithProgress(
  tenantId: string,
  path: string,
  file: File | Blob,
  onProgress: (progress: number) => void,
  metadata?: { contentType?: string; customMetadata?: Record<string, string> }
): UploadTask {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const storageRef = getTenantStorageRef(tenantId, path);
  const uploadMetadata = {
    contentType: metadata?.contentType || (file instanceof File ? file.type : 'application/octet-stream'),
    customMetadata: metadata?.customMetadata,
  };

  const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

  uploadTask.on('state_changed', (snapshot: UploadTaskSnapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    onProgress(progress);
  });

  return uploadTask;
}

/**
 * Get download URL for a tenant's file
 */
export async function getFileUrl(tenantId: string, path: string): Promise<string> {
  const storageRef = getTenantStorageRef(tenantId, path);
  return getDownloadURL(storageRef);
}

/**
 * Delete a file from tenant's storage
 */
export async function deleteFile(tenantId: string, path: string): Promise<void> {
  const storageRef = getTenantStorageRef(tenantId, path);
  await deleteObject(storageRef);
}

/**
 * List all files in a tenant's directory
 */
export async function listFiles(
  tenantId: string,
  path: string
): Promise<{ name: string; fullPath: string }[]> {
  const storageRef = getTenantStorageRef(tenantId, path);
  const result = await listAll(storageRef);

  return result.items.map((item) => ({
    name: item.name,
    fullPath: item.fullPath,
  }));
}

/**
 * Get file metadata
 */
export async function getFileMetadata(tenantId: string, path: string): Promise<FullMetadata> {
  const storageRef = getTenantStorageRef(tenantId, path);
  return getMetadata(storageRef);
}

/**
 * Update file metadata
 */
export async function updateFileMetadata(
  tenantId: string,
  path: string,
  metadata: { contentType?: string; customMetadata?: Record<string, string> }
): Promise<FullMetadata> {
  const storageRef = getTenantStorageRef(tenantId, path);
  return updateMetadata(storageRef, metadata);
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  return `${baseName}-${timestamp}-${randomStr}.${extension}`;
}

/**
 * Validate file type
 */
export function validateFileType(
  file: File,
  allowedTypes: string[] = ALLOWED_FILE_TYPES.all
): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize = MAX_FILE_SIZE): boolean {
  return file.size <= maxSize;
}

/**
 * Storage paths for different entity types
 */
export const STORAGE_PATHS = {
  packageCover: (packageId: string) => `packages/${packageId}/cover`,
  packageGallery: (packageId: string, filename: string) =>
    `packages/${packageId}/gallery/${filename}`,
  customerDocument: (customerId: string, filename: string) =>
    `customers/${customerId}/documents/${filename}`,
  paymentProof: (paymentId: string, filename: string) =>
    `payments/${paymentId}/${filename}`,
  userAvatar: (userId: string) => `users/${userId}/avatar`,
} as const;

/**
 * Upload package cover image
 */
export async function uploadPackageCover(
  tenantId: string,
  packageId: string,
  file: File
): Promise<string> {
  if (!validateFileType(file, ALLOWED_FILE_TYPES.images)) {
    throw new Error('Invalid file type. Only images are allowed.');
  }

  const path = STORAGE_PATHS.packageCover(packageId);
  return uploadFile(tenantId, path, file, { contentType: file.type });
}

/**
 * Upload customer document
 */
export async function uploadCustomerDocument(
  tenantId: string,
  customerId: string,
  file: File,
  documentType: string
): Promise<string> {
  if (!validateFileType(file, ALLOWED_FILE_TYPES.documents)) {
    throw new Error('Invalid file type. Only images and PDFs are allowed.');
  }

  const filename = generateUniqueFilename(file.name);
  const path = STORAGE_PATHS.customerDocument(customerId, filename);

  return uploadFile(tenantId, path, file, {
    contentType: file.type,
    customMetadata: { documentType },
  });
}

/**
 * Upload payment proof
 */
export async function uploadPaymentProof(
  tenantId: string,
  paymentId: string,
  file: File
): Promise<string> {
  if (!validateFileType(file, ALLOWED_FILE_TYPES.documents)) {
    throw new Error('Invalid file type. Only images and PDFs are allowed.');
  }

  const filename = generateUniqueFilename(file.name);
  const path = STORAGE_PATHS.paymentProof(paymentId, filename);

  return uploadFile(tenantId, path, file, { contentType: file.type });
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  tenantId: string,
  userId: string,
  file: File
): Promise<string> {
  if (!validateFileType(file, ALLOWED_FILE_TYPES.images)) {
    throw new Error('Invalid file type. Only images are allowed.');
  }

  const path = STORAGE_PATHS.userAvatar(userId);
  return uploadFile(tenantId, path, file, { contentType: file.type });
}
