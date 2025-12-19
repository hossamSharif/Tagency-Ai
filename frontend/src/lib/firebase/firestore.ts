import {
  collection,
  doc,
  getDoc as firestoreGetDoc,
  getDocs,
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  DocumentReference,
  DocumentData,
  QueryConstraint,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  serverTimestamp,
  Timestamp,
  WriteBatch,
  writeBatch,
  runTransaction,
  Transaction,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Get a document reference with tenant path prefix
 */
export function getTenantDocRef(
  tenantId: string,
  collectionName: string,
  docId: string
): DocumentReference {
  return doc(db, 'tenants', tenantId, collectionName, docId);
}

/**
 * Get a collection reference with tenant path prefix
 */
export function getTenantCollectionRef(tenantId: string, collectionName: string) {
  return collection(db, 'tenants', tenantId, collectionName);
}

/**
 * Get a document from a tenant's collection
 */
export async function getDocument<T = DocumentData>(
  tenantId: string,
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = getTenantDocRef(tenantId, collectionName, docId);
  const snapshot = await firestoreGetDoc(docRef);

  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as T;
  }
  return null;
}

/**
 * Get a document from a root-level collection (not tenant-scoped)
 */
export async function getRootDocument<T = DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const snapshot = await firestoreGetDoc(docRef);

  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as T;
  }
  return null;
}

/**
 * Set (create or overwrite) a document in a tenant's collection
 */
export async function setDocument<T extends DocumentData>(
  tenantId: string,
  collectionName: string,
  docId: string,
  data: T,
  merge = false
): Promise<void> {
  const docRef = getTenantDocRef(tenantId, collectionName, docId);
  await firestoreSetDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge });
}

/**
 * Create a new document with auto-generated ID in a tenant's collection
 */
export async function createDocument<T extends DocumentData>(
  tenantId: string,
  collectionName: string,
  data: T
): Promise<string> {
  const collectionRef = getTenantCollectionRef(tenantId, collectionName);
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update a document in a tenant's collection (partial update)
 */
export async function updateDocument<T extends DocumentData>(
  tenantId: string,
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  const docRef = getTenantDocRef(tenantId, collectionName, docId);
  await firestoreUpdateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

/**
 * Delete a document from a tenant's collection
 */
export async function deleteDocument(
  tenantId: string,
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = getTenantDocRef(tenantId, collectionName, docId);
  await firestoreDeleteDoc(docRef);
}

/**
 * Query documents from a tenant's collection
 */
export async function queryDocuments<T = DocumentData>(
  tenantId: string,
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const collectionRef = getTenantCollectionRef(tenantId, collectionName);
  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

/**
 * Subscribe to a document in a tenant's collection
 */
export function subscribeToDocument<T = DocumentData>(
  tenantId: string,
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = getTenantDocRef(tenantId, collectionName, docId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as T);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Document subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to a collection in a tenant's collection
 */
export function subscribeToCollection<T = DocumentData>(
  tenantId: string,
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const collectionRef = getTenantCollectionRef(tenantId, collectionName);
  const q = query(collectionRef, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
      callback(data);
    },
    (error) => {
      console.error('Collection subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * Get a write batch for multiple operations
 */
export function getBatch(): WriteBatch {
  return writeBatch(db);
}

/**
 * Run a transaction
 */
export async function runFirestoreTransaction<T>(
  updateFunction: (transaction: Transaction) => Promise<T>
): Promise<T> {
  return runTransaction(db, updateFunction);
}

/**
 * Generate a sequential number for a collection (e.g., INV-2024-0001)
 */
export async function generateSequentialNumber(
  tenantId: string,
  prefix: string,
  counterCollection = 'counters'
): Promise<string> {
  const year = new Date().getFullYear();
  const counterDocId = `${prefix.toLowerCase()}_${year}`;
  const counterRef = getTenantDocRef(tenantId, counterCollection, counterDocId);

  const newNumber = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let currentCount = 0;
    if (counterDoc.exists()) {
      currentCount = counterDoc.data().count || 0;
    }

    const nextCount = currentCount + 1;
    transaction.set(counterRef, { count: nextCount, updatedAt: serverTimestamp() });

    return nextCount;
  });

  // Format: PREFIX-YEAR-XXXX (e.g., INV-2024-0001)
  return `${prefix}-${year}-${String(newNumber).padStart(4, '0')}`;
}

// Re-export common Firestore utilities
export {
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
  type DocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
};
