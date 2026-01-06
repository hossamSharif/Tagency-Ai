const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function comprehensiveDataIntegrity() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';

    console.log('\n=== COMPREHENSIVE DATA INTEGRITY VERIFICATION ===\n');
    console.log(`Tenant: ${tenantId}`);
    console.log(`Date: ${new Date().toISOString()}\n`);

    const results = {
      pass: 0,
      fail: 0,
      warn: 0,
      skip: 0
    };

    // ===================================================================
    // 1. ACCOUNTS VERIFICATION
    // ===================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. ACCOUNTS VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const accountsSnapshot = await db.collection('tenants').doc(tenantId).collection('accounts').get();

    console.log(`Total Accounts: ${accountsSnapshot.size}`);

    if (accountsSnapshot.size === 0) {
      console.log('❌ FAIL: No accounts found\n');
      results.fail++;
    } else {
      console.log('✅ PASS: Accounts exist\n');
      results.pass++;
    }

    // Check required accounts
    const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const requiredAccounts = ['1001', '1002', '4001'];

    console.log('Required Accounts Check:');
    requiredAccounts.forEach(code => {
      const exists = accounts.find(a => a.code === code);
      if (exists) {
        console.log(`  ✅ ${code} - ${exists.name}`);
        results.pass++;
      } else {
        console.log(`  ❌ ${code} - MISSING`);
        results.fail++;
      }
    });

    // ===================================================================
    // 2. INVOICES VERIFICATION
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2. INVOICES VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const invoicesSnapshot = await db.collection('tenants').doc(tenantId).collection('invoices').get();

    console.log(`Total Invoices: ${invoicesSnapshot.size}`);

    if (invoicesSnapshot.size > 0) {
      const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check invoice numbering
      const invoiceNumbers = invoices.map(i => i.invoiceNumber).filter(Boolean);
      const uniqueNumbers = new Set(invoiceNumbers);

      if (invoiceNumbers.length === uniqueNumbers.size) {
        console.log('✅ PASS: All invoice numbers unique');
        results.pass++;
      } else {
        console.log('❌ FAIL: Duplicate invoice numbers detected');
        results.fail++;
      }

      // Check journal entries for issued invoices
      const issuedInvoices = invoices.filter(i => i.status === 'issued' || i.status === 'paid');
      const journalSnapshot = await db.collection('tenants').doc(tenantId).collection('journalEntries')
        .where('sourceType', '==', 'invoice').get();

      console.log(`Issued Invoices: ${issuedInvoices.length}`);
      console.log(`Invoice Journal Entries: ${journalSnapshot.size}`);

      if (issuedInvoices.length === journalSnapshot.size) {
        console.log('✅ PASS: All issued invoices have journal entries');
        results.pass++;
      } else {
        console.log(`⚠️  WARN: ${issuedInvoices.length - journalSnapshot.size} invoices missing journal entries`);
        results.warn++;
      }
    } else {
      console.log('⏸️  SKIP: No invoices to verify');
      results.skip++;
    }

    // ===================================================================
    // 3. PAYMENTS VERIFICATION
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. PAYMENTS VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const paymentsSnapshot = await db.collection('tenants').doc(tenantId).collection('payments').get();

    console.log(`Total Payments: ${paymentsSnapshot.size}`);

    if (paymentsSnapshot.size > 0) {
      const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check payment numbering
      const paymentNumbers = payments.map(p => p.paymentNumber).filter(Boolean);
      const uniquePayNumbers = new Set(paymentNumbers);

      if (paymentNumbers.length === uniquePayNumbers.size) {
        console.log('✅ PASS: All payment numbers unique');
        results.pass++;
      } else {
        console.log('❌ FAIL: Duplicate payment numbers detected');
        results.fail++;
      }

      // Check journal entries for completed payments (BUG-010)
      const completedPayments = payments.filter(p => p.status === 'completed');
      const paymentJournalSnapshot = await db.collection('tenants').doc(tenantId).collection('journalEntries')
        .where('sourceType', '==', 'payment').get();

      console.log(`Completed Payments: ${completedPayments.length}`);
      console.log(`Payment Journal Entries: ${paymentJournalSnapshot.size}`);

      if (completedPayments.length === paymentJournalSnapshot.size) {
        console.log('✅ PASS: All completed payments have journal entries');
        results.pass++;
      } else {
        console.log(`❌ FAIL: ${completedPayments.length - paymentJournalSnapshot.size} payments missing journal entries (BUG-010)`);
        results.fail++;
      }
    } else {
      console.log('⏸️  SKIP: No payments to verify');
      results.skip++;
    }

    // ===================================================================
    // 4. EXPENSES VERIFICATION
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4. EXPENSES VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const expensesSnapshot = await db.collection('tenants').doc(tenantId).collection('expenses').get();

    console.log(`Total Expenses: ${expensesSnapshot.size}`);

    if (expensesSnapshot.size > 0) {
      const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check journal entries for expenses
      const expenseJournalSnapshot = await db.collection('tenants').doc(tenantId).collection('journalEntries')
        .where('sourceType', '==', 'expense').get();

      console.log(`Expense Journal Entries: ${expenseJournalSnapshot.size}`);

      if (expenses.length === expenseJournalSnapshot.size) {
        console.log('✅ PASS: All expenses have journal entries');
        results.pass++;
      } else {
        console.log(`❌ FAIL: ${expenses.length - expenseJournalSnapshot.size} expenses missing journal entries`);
        results.fail++;
      }
    } else {
      console.log('⏸️  SKIP: No expenses to verify');
      results.skip++;
    }

    // ===================================================================
    // 5. JOURNAL ENTRIES VERIFICATION
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('5. JOURNAL ENTRIES VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const allJournalSnapshot = await db.collection('tenants').doc(tenantId).collection('journalEntries').get();

    console.log(`Total Journal Entries: ${allJournalSnapshot.size}`);

    if (allJournalSnapshot.size > 0) {
      const entries = allJournalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check all entries are balanced
      let allBalanced = true;
      let missingFields = 0;

      entries.forEach(entry => {
        if (entry.lines && entry.lines.length > 0) {
          const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
          const totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

          if (Math.abs(totalDebit - totalCredit) > 0.01) {
            allBalanced = false;
          }
        }

        // Check for BUG-011
        if (!entry.entryType || !entry.sourceDocumentId) {
          missingFields++;
        }
      });

      if (allBalanced) {
        console.log('✅ PASS: All journal entries balanced (DR = CR)');
        results.pass++;
      } else {
        console.log('❌ FAIL: Some journal entries unbalanced');
        results.fail++;
      }

      if (missingFields === 0) {
        console.log('✅ PASS: All journal entries have complete fields');
        results.pass++;
      } else {
        console.log(`❌ FAIL: ${missingFields} journal entries missing required fields (BUG-011)`);
        results.fail++;
      }
    } else {
      console.log('⏸️  SKIP: No journal entries to verify');
      results.skip++;
    }

    // ===================================================================
    // 6. ACCOUNTING EQUATION VERIFICATION
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6. ACCOUNTING EQUATION VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalIncome = 0;
    let totalExpenses = 0;

    accounts.forEach(account => {
      const balance = account.balance || 0;

      if (account.type === 'asset') {
        totalAssets += Math.abs(balance);
      } else if (account.type === 'liability') {
        totalLiabilities += Math.abs(balance);
      } else if (account.type === 'income') {
        totalIncome += Math.abs(balance);
      } else if (account.type === 'expense') {
        totalExpenses += Math.abs(balance);
      }
    });

    console.log('Account Totals:');
    console.log(`  Assets: ${totalAssets} SDG`);
    console.log(`  Liabilities: ${totalLiabilities} SDG`);
    console.log(`  Income: ${totalIncome} SDG`);
    console.log(`  Expenses: ${totalExpenses} SDG`);

    const leftSide = totalAssets + totalExpenses;
    const rightSide = totalLiabilities + totalIncome;
    const imbalance = Math.abs(leftSide - rightSide);

    console.log(`\nAccounting Equation:`);
    console.log(`  Assets + Expenses = ${leftSide}`);
    console.log(`  Liabilities + Income = ${rightSide}`);
    console.log(`  Imbalance: ${imbalance}`);

    if (imbalance < 0.01) {
      console.log('✅ PASS: Accounting equation balanced');
      results.pass++;
    } else {
      console.log('⚠️  WARN: Accounting equation imbalanced (likely due to BUG-010)');
      results.warn++;
    }

    // ===================================================================
    // 7. DATA COMPLETENESS CHECK
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('7. DATA COMPLETENESS CHECK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const customersSnapshot = await db.collection('tenants').doc(tenantId).collection('customers').get();
    const servicesSnapshot = await db.collection('tenants').doc(tenantId).collection('services').get();
    const partnersSnapshot = await db.collection('tenants').doc(tenantId).collection('partners').get();

    console.log('Collection Counts:');
    console.log(`  Customers: ${customersSnapshot.size}`);
    console.log(`  Services: ${servicesSnapshot.size}`);
    console.log(`  Partners: ${partnersSnapshot.size}`);
    console.log(`  Accounts: ${accountsSnapshot.size}`);
    console.log(`  Invoices: ${invoicesSnapshot.size}`);
    console.log(`  Payments: ${paymentsSnapshot.size}`);
    console.log(`  Expenses: ${expensesSnapshot.size}`);
    console.log(`  Journal Entries: ${allJournalSnapshot.size}`);

    const hasBaselineData = customersSnapshot.size > 0 && servicesSnapshot.size > 0;

    if (hasBaselineData) {
      console.log('\n✅ PASS: System has baseline data (customers and services)');
      results.pass++;
    } else {
      console.log('\n❌ FAIL: Missing baseline data');
      results.fail++;
    }

    // ===================================================================
    // FINAL SUMMARY
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('INTEGRITY TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const totalChecks = results.pass + results.fail + results.warn + results.skip;
    const healthScore = ((results.pass / (totalChecks - results.skip)) * 100).toFixed(1);

    console.log(`Total Checks: ${totalChecks}`);
    console.log(`  ✅ Passed: ${results.pass}`);
    console.log(`  ❌ Failed: ${results.fail}`);
    console.log(`  ⚠️  Warnings: ${results.warn}`);
    console.log(`  ⏸️  Skipped: ${results.skip}`);
    console.log();
    console.log(`System Health Score: ${healthScore}%`);
    console.log();

    if (results.fail === 0) {
      console.log('🎉 EXCELLENT: All integrity checks passed!');
    } else if (healthScore >= 80) {
      console.log('✅ GOOD: System mostly healthy with minor issues');
    } else if (healthScore >= 60) {
      console.log('⚠️  FAIR: System has notable issues requiring attention');
    } else {
      console.log('❌ POOR: System has critical integrity issues');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

comprehensiveDataIntegrity().then(() => process.exit(0));
