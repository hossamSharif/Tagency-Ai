'use server';

/**
 * Expense Server Actions
 * Handles business expense recording with journal entry creation
 * T071 [P] [US8] Create expense server actions
 */

import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser, type SessionUser } from '@/lib/auth/require-role';
import { ActionResult } from '@/lib/actions/types';
import type {
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
} from '@/types/models/expense';
import type { Account } from '@/types/models/account';
import { expenseSchema, searchExpensesSchema } from '@/lib/validations/expenses';
import {
  createJournalEntry,
  createSimpleEntry,
  createReversalEntry,
} from '@/lib/accounting/journal-entries';
import { generateSequentialNumber } from '@/lib/accounting/number-generator';
import { createAuditLog } from '@/lib/audit/create-log';

/**
 * Require authentication and return user with tenant
 */
async function requireAuthenticatedUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Unauthenticated');
  }
  return user;
}

/**
 * Serialize Firestore Timestamps to ISO strings for client components
 */
function serializeTimestamp(ts: unknown): unknown {
  if (!ts) return undefined;
  if (
    ts &&
    typeof ts === 'object' &&
    'toDate' in ts &&
    typeof (ts as { toDate: () => Date }).toDate === 'function'
  ) {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  return ts;
}

function serializeExpense(expense: Record<string, unknown>): Expense {
  return {
    ...expense,
    expenseDate: serializeTimestamp(expense.expenseDate),
    createdAt: serializeTimestamp(expense.createdAt),
    updatedAt: serializeTimestamp(expense.updatedAt),
    deletedAt: serializeTimestamp(expense.deletedAt),
    attachments: Array.isArray(expense.attachments)
      ? expense.attachments.map((att: Record<string, unknown>) => ({
          ...att,
          uploadedAt: serializeTimestamp(att.uploadedAt),
        }))
      : undefined,
  } as unknown as Expense;
}

/**
 * Get account by ID
 */
async function getAccount(
  tenantId: string,
  accountId: string
): Promise<Account | null> {
  const accountDoc = await adminDb
    .collection(`tenants/${tenantId}/accounts`)
    .doc(accountId)
    .get();

  if (!accountDoc.exists) {
    return null;
  }

  return { id: accountDoc.id, ...accountDoc.data() } as Account;
}

/**
 * Create a new expense
 * T071 [US8] - Create expense with journal entry
 */
export async function createExpense(
  input: CreateExpenseInput
): Promise<ActionResult<Expense>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate input
    const validatedData = expenseSchema.parse({
      ...input,
      expenseDate: input.expenseDate instanceof Date
        ? input.expenseDate
        : (input.expenseDate as any).toDate
        ? (input.expenseDate as any).toDate()
        : new Date(input.expenseDate as any),
    });

    // Verify accounts exist and are active
    const paymentAccount = await getAccount(tenantId, validatedData.accountId);
    if (!paymentAccount || !paymentAccount.isActive) {
      return {
        success: false,
        error: 'Invalid or inactive payment account',
      };
    }

    const expenseAccount = await getAccount(
      tenantId,
      validatedData.expenseAccountId
    );
    if (!expenseAccount || !expenseAccount.isActive) {
      return {
        success: false,
        error: 'Invalid or inactive expense account',
      };
    }

    // Verify account types
    if (!['cash', 'bank'].includes(paymentAccount.subtype)) {
      return {
        success: false,
        error: 'Payment account must be cash or bank account',
      };
    }

    if (expenseAccount.type !== 'expense') {
      return {
        success: false,
        error: 'Expense account must be of type expense',
      };
    }

    // Generate expense number
    const expenseNumber = await generateSequentialNumber(
      tenantId,
      'expenses',
      'EXP'
    );

    // Create expense document
    const expenseRef = adminDb
      .collection(`tenants/${tenantId}/expenses`)
      .doc();

    const now = Timestamp.now();
    const expenseDate = Timestamp.fromDate(validatedData.expenseDate);

    // Create journal entry first
    // Debit: Expense Account (increase expense)
    // Credit: Cash/Bank Account (decrease asset)
    const journalLines = createSimpleEntry(
      {
        id: expenseAccount.id,
        name: expenseAccount.name,
        code: expenseAccount.code,
      },
      {
        id: paymentAccount.id,
        name: paymentAccount.name,
        code: paymentAccount.code,
      },
      validatedData.amount
    );

    const journalEntry = await createJournalEntry({
      tenantId,
      description: `Expense: ${validatedData.description}`,
      type: 'expense',
      lines: journalLines,
      sourceType: 'expense',
      sourceId: expenseRef.id,
      createdBy: user.uid,
      date: validatedData.expenseDate,
    });

    const expense = {
      id: expenseRef.id,
      expenseNumber,
      description: validatedData.description,
      category: validatedData.category,
      amount: validatedData.amount,
      currency: validatedData.currency,
      paymentMethod: validatedData.paymentMethod,
      accountId: validatedData.accountId,
      accountName: validatedData.accountName,
      expenseAccountId: validatedData.expenseAccountId,
      expenseAccountName: validatedData.expenseAccountName,
      expenseDate: expenseDate as any,
      ...(validatedData.vendorName ? { vendorName: validatedData.vendorName } : {}),
      ...(validatedData.vendorInvoiceNumber ? { vendorInvoiceNumber: validatedData.vendorInvoiceNumber } : {}),
      ...(validatedData.attachments && validatedData.attachments.length > 0 ? {
        attachments: validatedData.attachments.map((att) => ({
          ...att,
          uploadedAt: att.uploadedAt instanceof Date
            ? Timestamp.fromDate(att.uploadedAt)
            : att.uploadedAt,
        }))
      } : {}),
      ...(validatedData.notes ? { notes: validatedData.notes } : {}),
      journalEntryId: journalEntry.id,
      createdBy: user.uid,
      createdAt: now as any,
      updatedAt: now as any,
    };

    await expenseRef.set(expense);

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: user.uid,
      action: 'create',
      resource: 'expense' as any,
      resourceId: expense.id,
      details: {
        expenseNumber: expense.expenseNumber,
        amount: expense.amount,
        category: expense.category,
        journalEntryId: journalEntry.id,
      },
    });

    revalidatePath('/[locale]/(dashboard)/accounting/expenses');
    revalidatePath('/[locale]/(dashboard)/accounting/journal');

    return {
      success: true,
      data: serializeExpense(expense),
    };
  } catch (error) {
    console.error('Error creating expense:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create expense',
    };
  }
}

/**
 * Get all expenses with optional filters
 * T071 [US8] - List expenses
 */
export async function getExpenses(params?: {
  category?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<Expense[]>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate params if provided
    const validatedParams = params
      ? searchExpensesSchema.parse(params)
      : { limit: 20, offset: 0 };

    let query: any = adminDb
      .collection(`tenants/${tenantId}/expenses`)
      .orderBy('expenseDate', 'desc');

    // Apply filters
    if (validatedParams.category) {
      query = query.where('category', '==', validatedParams.category);
    }

    if (validatedParams.accountId) {
      query = query.where('accountId', '==', validatedParams.accountId);
    }

    if (validatedParams.dateFrom) {
      const fromDate = Timestamp.fromDate(new Date(validatedParams.dateFrom));
      query = query.where('expenseDate', '>=', fromDate);
    }

    if (validatedParams.dateTo) {
      const toDate = Timestamp.fromDate(new Date(validatedParams.dateTo));
      query = query.where('expenseDate', '<=', toDate);
    }

    // Apply pagination
    if (validatedParams.offset && validatedParams.offset > 0) {
      query = query.offset(validatedParams.offset);
    }

    if (validatedParams.limit) {
      query = query.limit(validatedParams.limit);
    }

    const snapshot = await query.get();

    const expenses: Expense[] = [];
    snapshot.forEach((doc: any) => {
      const expenseData = doc.data();
      // Filter out soft-deleted expenses
      if (expenseData.deletedAt) return;
      expenses.push(serializeExpense({ id: doc.id, ...expenseData }));
    });

    return {
      success: true,
      data: expenses,
    };
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return {
      success: false,
      error: 'Failed to fetch expenses',
    };
  }
}

/**
 * Get a single expense by ID
 * T071 [US8] - Get expense detail
 */
export async function getExpense(
  expenseId: string
): Promise<ActionResult<Expense>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const doc = await adminDb
      .collection(`tenants/${tenantId}/expenses`)
      .doc(expenseId)
      .get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'Expense not found',
      };
    }

    return {
      success: true,
      data: serializeExpense({ id: doc.id, ...doc.data() }),
    };
  } catch (error) {
    console.error('Error fetching expense:', error);
    return {
      success: false,
      error: 'Failed to fetch expense',
    };
  }
}

/**
 * Update an expense
 * T071 [US8] - Update expense
 * Note: Cannot change accounts after creation (accounting integrity)
 */
export async function updateExpense(
  expenseId: string,
  input: UpdateExpenseInput
): Promise<ActionResult<Expense>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    const docRef = adminDb
      .collection(`tenants/${tenantId}/expenses`)
      .doc(expenseId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        success: false,
        error: 'Expense not found',
      };
    }

    const existingExpense = doc.data() as Expense;

    // Validate input (partial update)
    const updates: Record<string, unknown> = {
      ...input,
      updatedAt: Timestamp.now(),
    };

    // If expenseDate is being updated, convert to Timestamp
    if (input.expenseDate) {
      updates.expenseDate = Timestamp.fromDate(
        input.expenseDate instanceof Date
          ? input.expenseDate
          : (input.expenseDate as any).toDate
          ? (input.expenseDate as any).toDate()
          : new Date(input.expenseDate as any)
      );
    }

    // Handle attachments if provided
    if (input.attachments) {
      updates.attachments = input.attachments.map((att) => ({
        ...att,
        uploadedAt:
          att.uploadedAt instanceof Date
            ? Timestamp.fromDate(att.uploadedAt)
            : att.uploadedAt,
      }));
    }

    await docRef.update(updates);

    const updated = await docRef.get();

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: user.uid,
      action: 'update',
      resource: 'expense' as any,
      resourceId: expenseId,
      details: {
        expenseNumber: existingExpense.expenseNumber,
        updatedFields: Object.keys(input),
      },
    });

    revalidatePath('/[locale]/(dashboard)/accounting/expenses');
    revalidatePath(`/[locale]/(dashboard)/accounting/expenses/${expenseId}`);

    return {
      success: true,
      data: serializeExpense({ id: updated.id, ...updated.data() }),
    };
  } catch (error) {
    console.error('Error updating expense:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update expense',
    };
  }
}

/**
 * Delete an expense with journal entry reversal (soft delete)
 * T071 [US8] - Delete expense
 * Creates a reversal journal entry to maintain accounting integrity
 */
export async function deleteExpense(
  expenseId: string,
  reason: string
): Promise<ActionResult<{ reversalJournalEntryId?: string }>> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    // Validate reason is provided
    if (!reason || reason.trim().length === 0) {
      return {
        success: false,
        error: 'Deletion reason is required',
      };
    }

    const docRef = adminDb
      .collection(`tenants/${tenantId}/expenses`)
      .doc(expenseId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        success: false,
        error: 'Expense not found',
      };
    }

    const expense = doc.data() as Expense;

    // Check if expense is already deleted
    if (expense.deletedAt) {
      return {
        success: false,
        error: 'Expense has already been deleted',
      };
    }

    let reversalJournalEntryId: string | undefined;

    // Create reversal journal entry if original journal entry exists
    if (expense.journalEntryId) {
      try {
        const reversalEntry = await createReversalEntry(
          tenantId,
          expense.journalEntryId,
          user.uid,
          `Expense deletion: ${reason.trim()}`
        );
        reversalJournalEntryId = reversalEntry.id;
      } catch (reversalError) {
        // If the journal entry was already reversed or doesn't exist, log and continue
        console.warn('Could not create reversal entry:', reversalError);
        // Don't fail the deletion if reversal fails due to already-reversed entry
        if (reversalError instanceof Error &&
            !reversalError.message.includes('already been reversed') &&
            !reversalError.message.includes('not found')) {
          throw reversalError;
        }
      }
    }

    // Soft-delete the expense (update with deletedAt instead of delete)
    const now = Timestamp.now();
    await docRef.update({
      deletedAt: now,
      deletedBy: user.uid,
      deletionReason: reason.trim(),
      ...(reversalJournalEntryId ? { reversalJournalEntryId } : {}),
      updatedAt: now,
    });

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: user.uid,
      action: 'delete',
      resource: 'expense' as any,
      resourceId: expenseId,
      details: {
        expenseNumber: expense.expenseNumber,
        amount: expense.amount,
        category: expense.category,
        reason: reason.trim(),
        reversalJournalEntryId,
      },
    });

    revalidatePath('/[locale]/(dashboard)/accounting/expenses');
    revalidatePath('/[locale]/(dashboard)/accounting/journal');

    return {
      success: true,
      data: { reversalJournalEntryId },
    };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete expense',
    };
  }
}

/**
 * Get expense summary by category for reporting
 * T071 [US8] - Expense summary
 */
export async function getExpenseSummary(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<
  ActionResult<
    Array<{
      category: string;
      total: number;
      count: number;
    }>
  >
> {
  try {
    const user = await requireAuthenticatedUser();
    const tenantId = user.tenantId;

    let query: any = adminDb
      .collection(`tenants/${tenantId}/expenses`)
      .orderBy('expenseDate', 'desc');

    if (params?.dateFrom) {
      const fromDate = Timestamp.fromDate(new Date(params.dateFrom));
      query = query.where('expenseDate', '>=', fromDate);
    }

    if (params?.dateTo) {
      const toDate = Timestamp.fromDate(new Date(params.dateTo));
      query = query.where('expenseDate', '<=', toDate);
    }

    const snapshot = await query.get();

    // Group by category
    const summaryMap = new Map<
      string,
      { total: number; count: number }
    >();

    snapshot.forEach((doc: any) => {
      const expense = doc.data() as Expense;
      // Filter out soft-deleted expenses
      if (expense.deletedAt) return;
      const existing = summaryMap.get(expense.category) || {
        total: 0,
        count: 0,
      };
      summaryMap.set(expense.category, {
        total: existing.total + expense.amount,
        count: existing.count + 1,
      });
    });

    const summary = Array.from(summaryMap.entries()).map(
      ([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
      })
    );

    // Sort by total descending
    summary.sort((a, b) => b.total - a.total);

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    console.error('Error calculating expense summary:', error);
    return {
      success: false,
      error: 'Failed to calculate expense summary',
    };
  }
}
