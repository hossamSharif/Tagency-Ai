/**
 * Sequential Number Generator Utility
 * Generates unique sequential numbers for invoices, payments, journal entries, etc.
 * T013 - Create sequential number generator utility
 */

import { adminDb } from '@/lib/firebase/admin';

/**
 * Counter document structure
 */
interface Counter {
  year: number;
  sequence: number;
}

/**
 * Generate a sequential number with year prefix
 * Format: {PREFIX}-{YEAR}-{SEQUENCE}
 * Example: INV-2024-0001, PAY-2024-0001, JE-2024-0001
 *
 * Uses Firestore transaction to ensure uniqueness
 */
export async function generateSequentialNumber(
  tenantId: string,
  counterType: 'invoices' | 'payments' | 'expenses' | 'journalEntries',
  prefix: string
): Promise<string> {
  const counterRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('counters')
    .doc(counterType);

  const currentYear = new Date().getFullYear();

  // Use transaction to ensure atomic increment
  const result = await adminDb.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let counter: Counter;

    if (!counterDoc.exists) {
      // Initialize counter if it doesn't exist
      counter = {
        year: currentYear,
        sequence: 1,
      };
    } else {
      const data = counterDoc.data() as Counter;

      // Reset sequence if year changed
      if (data.year !== currentYear) {
        counter = {
          year: currentYear,
          sequence: 1,
        };
      } else {
        counter = {
          year: data.year,
          sequence: data.sequence + 1,
        };
      }
    }

    // Update the counter
    transaction.set(counterRef, counter);

    // Return the formatted number
    const sequenceStr = counter.sequence.toString().padStart(4, '0');
    return `${prefix}-${counter.year}-${sequenceStr}`;
  });

  return result;
}

/**
 * Generate invoice number
 * Format: INV-2024-0001
 */
export async function generateInvoiceNumber(
  tenantId: string
): Promise<string> {
  return generateSequentialNumber(tenantId, 'invoices', 'INV');
}

/**
 * Generate payment number
 * Format: PAY-2024-0001
 */
export async function generatePaymentNumber(
  tenantId: string
): Promise<string> {
  return generateSequentialNumber(tenantId, 'payments', 'PAY');
}

/**
 * Generate expense number
 * Format: EXP-2024-0001
 */
export async function generateExpenseNumber(
  tenantId: string
): Promise<string> {
  return generateSequentialNumber(tenantId, 'expenses', 'EXP');
}

/**
 * Generate journal entry number
 * Format: JE-2024-0001
 */
export async function generateJournalEntryNumber(
  tenantId: string
): Promise<string> {
  return generateSequentialNumber(tenantId, 'journalEntries', 'JE');
}

/**
 * Get the current counter value (for display/debugging)
 */
export async function getCurrentCounter(
  tenantId: string,
  counterType: 'invoices' | 'payments' | 'expenses' | 'journalEntries'
): Promise<Counter | null> {
  const counterRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('counters')
    .doc(counterType);

  const counterDoc = await counterRef.get();

  if (!counterDoc.exists) {
    return null;
  }

  return counterDoc.data() as Counter;
}

/**
 * Reset counter for a specific type
 * CAUTION: Only use for testing or when absolutely necessary
 */
export async function resetCounter(
  tenantId: string,
  counterType: 'invoices' | 'payments' | 'expenses' | 'journalEntries',
  year?: number,
  sequence: number = 0
): Promise<void> {
  const counterRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('counters')
    .doc(counterType);

  await counterRef.set({
    year: year || new Date().getFullYear(),
    sequence,
  });
}
