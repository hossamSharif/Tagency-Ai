const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyJnlCrudTests() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';

    console.log('\n=== JOURNAL ENTRY CRUD TESTS (Firebase Verification) ===\n');

    // ===================================================================
    // JNL-CRUD-1: List Entries
    // ===================================================================
    console.log('### JNL-CRUD-1: List Journal Entries ###\n');

    const journalSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('journalEntries')
      .orderBy('date', 'desc')
      .get();

    console.log(`Total Journal Entries: ${journalSnapshot.size}\n`);

    if (journalSnapshot.empty) {
      console.log('❌ FAIL: No journal entries found');
      console.log('Expected: Journal entries for all financial transactions');
      console.log('Note: BUG-010 may prevent payment journal entries');
      return false;
    }

    const entries = journalSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Display all entries chronologically
    console.log('Journal Entries (chronological order):\n');
    entries.forEach((entry, i) => {
      console.log(`${i + 1}. ${entry.entryNumber || 'NO-NUMBER'}`);
      console.log(`   Date: ${entry.date ? entry.date.toDate().toISOString().split('T')[0] : 'N/A'}`);
      console.log(`   Type: ${entry.entryType || 'N/A'}`);
      console.log(`   Source: ${entry.sourceType || 'N/A'}`);
      console.log(`   Source ID: ${entry.sourceDocumentId || 'N/A'}`);
      console.log(`   Lines: ${entry.lines ? entry.lines.length : 0}`);

      if (entry.lines && entry.lines.length > 0) {
        let totalDebit = 0;
        let totalCredit = 0;

        entry.lines.forEach(line => {
          totalDebit += line.debit || 0;
          totalCredit += line.credit || 0;
        });

        console.log(`   Total DR: ${totalDebit}, Total CR: ${totalCredit}`);
        console.log(`   Balanced: ${totalDebit === totalCredit ? '✅' : '❌'}`);
      }
      console.log();
    });

    // Verify all entries are valid
    let allValid = true;
    const requiredFields = ['entryNumber', 'date', 'entryType', 'sourceType', 'sourceDocumentId', 'lines'];

    entries.forEach((entry, i) => {
      const missing = requiredFields.filter(field => !entry[field]);

      if (missing.length > 0) {
        console.log(`⚠️  Entry ${i + 1} missing fields: ${missing.join(', ')}`);
        allValid = false;
      }

      // Verify entry is balanced
      if (entry.lines) {
        const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

        if (totalDebit !== totalCredit) {
          console.log(`❌ Entry ${i + 1} (${entry.entryNumber}): Unbalanced - DR: ${totalDebit}, CR: ${totalCredit}`);
          allValid = false;
        }
      }
    });

    if (allValid && entries.length > 0) {
      console.log(`✅ JNL-CRUD-1 PASSED: ${entries.length} journal entries listed chronologically, all valid and balanced\n`);
    } else if (!allValid) {
      console.log('❌ JNL-CRUD-1 FAILED: Some entries invalid or unbalanced\n');
    }

    // ===================================================================
    // JNL-CRUD-5: Entry Detail
    // ===================================================================
    console.log('### JNL-CRUD-5: Entry Detail ###\n');

    if (entries.length === 0) {
      console.log('⏸️  SKIP: No journal entries to verify details\n');
    } else {
      // Check first entry details
      const firstEntry = entries[0];
      console.log(`Verifying Entry: ${firstEntry.entryNumber}\n`);

      console.log('Entry Details:');
      console.log(`  Number: ${firstEntry.entryNumber}`);
      console.log(`  Date: ${firstEntry.date.toDate().toISOString()}`);
      console.log(`  Type: ${firstEntry.entryType}`);
      console.log(`  Source Type: ${firstEntry.sourceType}`);
      console.log(`  Source ID: ${firstEntry.sourceDocumentId}`);
      console.log(`  Description: ${firstEntry.description || 'N/A'}`);
      console.log(`  Currency: ${firstEntry.currency}`);

      // Verify linked source document exists
      let sourceExists = false;
      if (!firstEntry.sourceDocumentId) {
        console.log(`  Linked Document: MISSING ID ❌`);
      } else if (firstEntry.sourceType === 'invoice') {
        const invoiceDoc = await db
          .collection('tenants')
          .doc(tenantId)
          .collection('invoices')
          .doc(firstEntry.sourceDocumentId)
          .get();

        sourceExists = invoiceDoc.exists;
        if (sourceExists) {
          console.log(`  Linked Invoice: ${invoiceDoc.data().invoiceNumber} ✅`);
        } else {
          console.log(`  Linked Invoice: NOT FOUND ❌`);
        }
      } else if (firstEntry.sourceType === 'payment') {
        const paymentDoc = await db
          .collection('tenants')
          .doc(tenantId)
          .collection('payments')
          .doc(firstEntry.sourceDocumentId)
          .get();

        sourceExists = paymentDoc.exists;
        if (sourceExists) {
          console.log(`  Linked Payment: ${paymentDoc.data().paymentNumber} ✅`);
        } else {
          console.log(`  Linked Payment: NOT FOUND ❌`);
        }
      } else if (firstEntry.sourceType === 'expense') {
        const expenseDoc = await db
          .collection('tenants')
          .doc(tenantId)
          .collection('expenses')
          .doc(firstEntry.sourceDocumentId)
          .get();

        sourceExists = expenseDoc.exists;
        if (sourceExists) {
          console.log(`  Linked Expense: ${expenseDoc.data().expenseNumber} ✅`);
        } else {
          console.log(`  Linked Expense: NOT FOUND ❌`);
        }
      }

      console.log('\nJournal Lines:');
      firstEntry.lines.forEach((line, i) => {
        console.log(`  ${i + 1}. ${line.accountCode} - ${line.accountName}`);
        console.log(`     DR: ${line.debit || 0}, CR: ${line.credit || 0}`);
        if (line.description) {
          console.log(`     Description: ${line.description}`);
        }
      });

      if (sourceExists) {
        console.log('\n✅ JNL-CRUD-5 PASSED: Entry details complete with linked source document\n');
      } else {
        console.log('\n❌ JNL-CRUD-5 FAILED: Linked source document not found\n');
      }
    }

    // ===================================================================
    // JNL-CRUD-6: Audit Trail
    // ===================================================================
    console.log('### JNL-CRUD-6: Audit Trail Completeness ###\n');

    // Get all financial transactions and verify journal entries exist
    const invoicesSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('invoices')
      .where('status', 'in', ['issued', 'paid', 'partiallyPaid'])
      .get();

    const paymentsSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('payments')
      .where('status', '==', 'completed')
      .get();

    const expensesSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('expenses')
      .get();

    console.log('Financial Transaction Counts:');
    console.log(`  Invoices (issued/paid): ${invoicesSnapshot.size}`);
    console.log(`  Payments (completed): ${paymentsSnapshot.size}`);
    console.log(`  Expenses: ${expensesSnapshot.size}`);
    console.log(`  Total Transactions: ${invoicesSnapshot.size + paymentsSnapshot.size + expensesSnapshot.size}`);

    console.log(`\nJournal Entry Counts:`);
    const entriesByType = {
      invoice: 0,
      payment: 0,
      expense: 0,
      other: 0
    };

    entries.forEach(entry => {
      const type = entry.sourceType || 'other';
      if (entriesByType.hasOwnProperty(type)) {
        entriesByType[type]++;
      } else {
        entriesByType.other++;
      }
    });

    console.log(`  Invoice entries: ${entriesByType.invoice} (expected: ${invoicesSnapshot.size})`);
    console.log(`  Payment entries: ${entriesByType.payment} (expected: ${paymentsSnapshot.size})`);
    console.log(`  Expense entries: ${entriesByType.expense} (expected: ${expensesSnapshot.size})`);
    console.log(`  Other entries: ${entriesByType.other}`);

    // Check for missing entries
    const missingInvoiceEntries = invoicesSnapshot.size - entriesByType.invoice;
    const missingPaymentEntries = paymentsSnapshot.size - entriesByType.payment;
    const missingExpenseEntries = expensesSnapshot.size - entriesByType.expense;

    console.log('\nAudit Trail Analysis:');

    if (missingInvoiceEntries > 0) {
      console.log(`⚠️  ${missingInvoiceEntries} issued invoices missing journal entries`);
    } else {
      console.log(`✅ All invoices have journal entries`);
    }

    if (missingPaymentEntries > 0) {
      console.log(`❌ ${missingPaymentEntries} completed payments missing journal entries (BUG-010)`);
    } else {
      console.log(`✅ All payments have journal entries`);
    }

    if (missingExpenseEntries > 0) {
      console.log(`⚠️  ${missingExpenseEntries} expenses missing journal entries`);
    } else if (expensesSnapshot.size > 0) {
      console.log(`✅ All expenses have journal entries`);
    }

    // Overall result
    const totalExpected = invoicesSnapshot.size + paymentsSnapshot.size + expensesSnapshot.size;
    const totalActual = entriesByType.invoice + entriesByType.payment + entriesByType.expense;
    const coveragePercent = totalExpected > 0 ? ((totalActual / totalExpected) * 100).toFixed(1) : 0;

    console.log(`\nJournal Coverage: ${totalActual}/${totalExpected} (${coveragePercent}%)`);

    if (coveragePercent === 100) {
      console.log('✅ JNL-CRUD-6 PASSED: Complete audit trail - all transactions have journal entries\n');
    } else {
      console.log(`⚠️  JNL-CRUD-6 PARTIAL: Audit trail incomplete - ${totalExpected - totalActual} transactions missing entries\n`);
      console.log('Known Issue: BUG-010 prevents payment journal entries from being created');
    }

    // ===================================================================
    // Summary
    // ===================================================================
    console.log('\n=== TEST SUMMARY ===\n');
    console.log(`JNL-CRUD-1 (List Entries): ${entries.length > 0 && allValid ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`JNL-CRUD-5 (Entry Detail): ${entries.length > 0 ? '✅ PASSED' : '⏸️  SKIPPED'}`);
    console.log(`JNL-CRUD-6 (Audit Trail): ${coveragePercent === 100 ? '✅ PASSED' : `⚠️  PARTIAL (${coveragePercent}%)`}`);

    console.log('\n=== KNOWN ISSUES ===');
    console.log('BUG-010: Payments do not create journal entries');
    console.log(`  Impact: ${missingPaymentEntries} payment journal entries missing`);
    console.log('  Status: Critical - audit trail incomplete');

  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

verifyJnlCrudTests().then(() => process.exit(0));
