/**
 * Firestore helper functions using Firebase Admin SDK
 * Use these functions in server actions for bypassing security rules
 */

import { adminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Get a document reference with tenant path prefix (Admin SDK)
 */
export function getAdminTenantDocRef(
  tenantId: string,
  collectionName: string,
  docId: string
) {
  return adminDb.doc(`tenants/${tenantId}/${collectionName}/${docId}`);
}

/**
 * Get a collection reference with tenant path prefix (Admin SDK)
 */
export function getAdminTenantCollectionRef(tenantId: string, collectionName: string) {
  return adminDb.collection(`tenants/${tenantId}/${collectionName}`);
}

/**
 * Get a document from a tenant's collection (Admin SDK)
 */
export async function getAdminDocument<T = any>(
  tenantId: string,
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = getAdminTenantDocRef(tenantId, collectionName, docId);
  const snapshot = await docRef.get();

  if (snapshot.exists) {
    return { id: snapshot.id, ...snapshot.data() } as T;
  }
  return null;
}

/**
 * Set (create or overwrite) a document in a tenant's collection (Admin SDK)
 */
export async function setAdminDocument<T extends Record<string, any>>(
  tenantId: string,
  collectionName: string,
  docId: string,
  data: T,
  merge = false
): Promise<void> {
  const docRef = getAdminTenantDocRef(tenantId, collectionName, docId);
  await docRef.set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge });
}

/**
 * Create a new document with auto-generated ID in a tenant's collection (Admin SDK)
 */
export async function createAdminDocument<T extends Record<string, any>>(
  tenantId: string,
  collectionName: string,
  data: T
): Promise<string> {
  const collectionRef = getAdminTenantCollectionRef(tenantId, collectionName);
  const docRef = await collectionRef.add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update a document in a tenant's collection (Admin SDK)
 */
export async function updateAdminDocument<T extends Record<string, any>>(
  tenantId: string,
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  const docRef = getAdminTenantDocRef(tenantId, collectionName, docId);
  await docRef.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
}

/**
 * Delete a document from a tenant's collection (Admin SDK)
 */
export async function deleteAdminDocument(
  tenantId: string,
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = getAdminTenantDocRef(tenantId, collectionName, docId);
  await docRef.delete();
}
