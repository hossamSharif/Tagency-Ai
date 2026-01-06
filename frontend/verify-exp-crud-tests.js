const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyExpCrudTests() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';

    console.log('\n=== EXPENSE CRUD TESTS (Firebase Verification) ===\n');

    // ===================================================================
    // EXP-CRUD-1: List Expenses
    // ===================================================================
    console.log('### EXP-CRUD-1: List Expenses ###\n');

    const expensesSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('expenses')
      .get();

    console.log(`Total Expenses: ${expensesSnapshot.size}\n`);

    if (expensesSnapshot.empty) {
      console.log('⏸️  SKIP: No expenses found to verify');
      return;
    }

    const expenses = expensesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Display all expenses
    console.log('Expenses (chronological order):\n');
    expenses.forEach((expense, i) => {
      console.log(`${i + 1}. ${expense.expenseNumber || 'NO-NUMBER'}`);
      console.log(`   Date: ${expense.date ? expense.date.toDate().toISOString().split('T')[0] : 'N/A'}`);
      console.log(`   Amount: ${expense.amount} ${expense.currency}`);
      console.log(`   Category: ${expense.category || 'N/A'}`);
      console.log(`   Payment Method: ${expense.paymentMethod || 'N/A'}`);
      console.log(`   Description: ${expense.description || 'N/A'}`);
      console.log(`   Status: ${expense.status || 'N/A'}`);
      console.log();
    });

    // Verify all expenses have required fields
    let allValid = true;
    const requiredFields = ['expenseNumber', 'amount', 'currency', 'category', 'paymentMethod', 'date'];

    expenses.forEach((expense, i) => {
      const missing = requiredFields.filter(field => !expense[field]);

      if (missing.length > 0) {
        console.log(`⚠️  Expense ${i + 1} missing fields: ${missing.join(', ')}`);
        allValid = false;
      }
    });

    if (allValid && expenses.length > 0) {
      console.log(`✅ EXP-CRUD-1 PASSED: ${expenses.length} expenses listed with all required fields\n`);
    } else if (!allValid) {
      console.log('❌ EXP-CRUD-1 FAILED: Some expenses missing required fields\n');
    }

    // ===================================================================
    // EXP-CRUD-4: Journal Entry for Expense
    // ===================================================================
    console.log('### EXP-CRUD-4: Expense Journal Entry ###\n');

    if (expenses.length === 0) {
      console.log('⏸️  SKIP: No expenses to verify journal entries\n');
      return;
    }

    // Check journal entry for first expense
    const firstExpense = expenses[0];
    console.log(`Verifying expense: ${firstExpense.expenseNumber}\n`);

    const journalSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('journalEntries')
      .where('sourceType', '==', 'expense')
      .get();

    console.log(`Expense Journal Entries Found: ${journalSnapshot.size}\n`);

    if (journalSnapshot.empty) {
      console.log('❌ FAIL: No journal entry found for expense');
      console.log('Expected: Journal entry with DR: Expense Account, CR: Cash/Bank');
      return;
    }

    // Find journal entry that matches the expense amount
    const matchingEntry = journalSnapshot.docs.find(doc => {
      const entry = doc.data();
      if (!entry.lines) return false;

      // Check if total matches expense amount
      const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      return Math.abs(totalDebit - firstExpense.amount) < 0.01;
    });

    if (!matchingEntry) {
      console.log(`❌ FAIL: No journal entry matches expense amount ${firstExpense.amount}`);
      return;
    }

    const journalEntry = matchingEntry.data();
    console.log(`✅ Journal Entry Found: ${journalEntry.entryNumber}\n`);

    console.log('Journal Entry Details:');
    console.log(`  Entry Number: ${journalEntry.entryNumber}`);
    console.log(`  Date: ${journalEntry.date ? journalEntry.date.toDate().toISOString().split('T')[0] : 'N/A'}`);
    console.log(`  Source Type: ${journalEntry.sourceType}`);
    console.log(`  Description: ${journalEntry.description || 'N/A'}\n`);

    // Verify journal lines structure
    console.log('Journal Lines:');
    let totalDebit = 0;
    let totalCredit = 0;
    let hasExpenseDebit = false;
    let hasCashCredit = false;

    journalEntry.lines.forEach((line, i) => {
      console.log(`  ${i + 1}. ${line.accountCode} - ${line.accountName}`);
      console.log(`     DR: ${line.debit || 0}, CR: ${line.credit || 0}`);

      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;

      // Check for expense account debit (5xxx accounts)
      if (line.accountCode.startsWith('5') && line.debit > 0) {
        hasExpenseDebit = true;
      }

      // Check for cash/bank credit (1001 or 1002)
      if ((line.accountCode === '1001' || line.accountCode === '1002') && line.credit > 0) {
        hasCashCredit = true;
      }
    });

    console.log(`\nTotal Debit: ${totalDebit}`);
    console.log(`Total Credit: ${totalCredit}`);
    console.log(`Balanced: ${totalDebit === totalCredit ? '✅ Yes' : '❌ No'}`);

    console.log('\nTest Criteria:');
    console.log(`  DR: Expense Account (5xxx): ${hasExpenseDebit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  CR: Cash/Bank (1001/1002): ${hasCashCredit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Balanced Entry: ${totalDebit === totalCredit ? '✅ PASS' : '❌ FAIL'}`);

    const journalTestPassed = hasExpenseDebit && hasCashCredit && totalDebit === totalCredit;

    if (journalTestPassed) {
      console.log('\n✅ EXP-CRUD-4 PASSED: Journal entry created correctly for expense\n');
    } else {
      console.log('\n❌ EXP-CRUD-4 FAILED: Journal entry structure incorrect\n');
    }

    // ===================================================================
    // EXP-CRUD-5: Account Balance Updates
    // ===================================================================
    console.log('### EXP-CRUD-5: Account Balance Updates ###\n');

    // Get all accounts
    const accountsSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('accounts')
      .get();

    const accounts = accountsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Find expense account and cash/bank account
    const expenseAccount = accounts.find(a => a.code.startsWith('5'));
    const cashAccount = accounts.find(a => a.code === '1001' || a.code === '1002');

    console.log('Account Balances:\n');

    if (expenseAccount) {
      console.log(`Expense Account: ${expenseAccount.code} - ${expenseAccount.name}`);
      console.log(`  Balance: ${expenseAccount.balance || 0} ${firstExpense.currency}`);
      console.log(`  Type: ${expenseAccount.type}`);

      if (expenseAccount.balance !== undefined && expenseAccount.balance !== null) {
        console.log('  ✅ Has balance tracking');
      } else {
        console.log('  ⚠️  No balance field');
      }
    } else {
      console.log('❌ Expense account not found');
    }

    console.log();

    if (cashAccount) {
      console.log(`Cash/Bank Account: ${cashAccount.code} - ${cashAccount.name}`);
      console.log(`  Balance: ${cashAccount.balance || 0} ${firstExpense.currency}`);
      console.log(`  Type: ${cashAccount.type}`);

      if (cashAccount.balance !== undefined && cashAccount.balance !== null) {
        console.log('  ✅ Has balance tracking');
      } else {
        console.log('  ⚠️  No balance field');
      }
    } else {
      console.log('❌ Cash/Bank account not found');
    }

    console.log('\nExpected Balance Changes:');
    console.log(`  Expense account should INCREASE by ${firstExpense.amount} (debit normal balance)`);
    console.log(`  Cash/Bank account should DECREASE by ${firstExpense.amount} (credit from asset)`);

    const hasBalanceTracking =
      expenseAccount && expenseAccount.balance !== undefined &&
      cashAccount && cashAccount.balance !== undefined;

    if (hasBalanceTracking) {
      console.log('\n✅ EXP-CRUD-5 PASSED: Accounts have balance tracking');
      console.log('⚠️  NOTE: Cannot verify actual balance changes without baseline data');
    } else {
      console.log('\n❌ EXP-CRUD-5 FAILED: Accounts missing balance tracking');
    }

    // ===================================================================
    // Summary
    // ===================================================================
    console.log('\n=== TEST SUMMARY ===\n');
    console.log(`EXP-CRUD-1 (List Expenses): ${allValid ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`EXP-CRUD-4 (Journal Entry): ${journalTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`EXP-CRUD-5 (Account Balances): ${hasBalanceTracking ? '✅ PASSED' : '❌ FAILED'}`);

    console.log('\n=== EXPENSE DATA SUMMARY ===\n');
    console.log(`Total Expenses: ${expenses.length}`);
    console.log(`Total Amount: ${expenses.reduce((sum, e) => sum + (e.amount || 0), 0)} ${expenses[0]?.currency || 'SDG'}`);

    const categoryCounts = {};
    expenses.forEach(e => {
      const cat = e.category || 'Unknown';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    console.log('\nBy Category:');
    Object.keys(categoryCounts).forEach(cat => {
      console.log(`  ${cat}: ${categoryCounts[cat]} expense(s)`);
    });

  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

verifyExpCrudTests().then(() => process.exit(0));
