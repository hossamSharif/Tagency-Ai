const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyTransactionNumbering() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';

    console.log('\n=== TRANSACTION NUMBERING VERIFICATION ===\n');
    console.log(`Tenant: ${tenantId}`);
    console.log(`Date: ${new Date().toISOString()}\n`);

    const results = {
      pass: 0,
      fail: 0,
      warn: 0
    };

    // ===================================================================
    // 1. INVOICE NUMBERING
    // ===================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. INVOICE NUMBERING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const invoicesSnapshot = await db.collection('tenants').doc(tenantId)
      .collection('invoices').get();

    console.log(`Total Invoices: ${invoicesSnapshot.size}\n`);

    if (invoicesSnapshot.size > 0) {
      const invoices = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const numA = parseInt(a.invoiceNumber?.split('-')[2] || '0');
        const numB = parseInt(b.invoiceNumber?.split('-')[2] || '0');
        return numA - numB;
      });

      console.log('Invoice Numbers (sorted):');
      invoices.forEach((inv, i) => {
        console.log(`  ${i + 1}. ${inv.invoiceNumber} (${inv.status})`);
      });

      // Check format: INV-YYYY-NNNN
      let formatValid = true;
      const regex = /^INV-\d{4}-\d{4}$/;

      invoices.forEach(inv => {
        if (!regex.test(inv.invoiceNumber)) {
          console.log(`\n⚠️  ${inv.invoiceNumber}: Invalid format (expected INV-YYYY-NNNN)`);
          formatValid = false;
        }
      });

      if (formatValid) {
        console.log('\n✅ Format Valid: All invoices follow INV-YYYY-NNNN pattern');
        results.pass++;
      } else {
        console.log('\n❌ Format Invalid: Some invoices have wrong format');
        results.fail++;
      }

      // Check uniqueness
      const numbers = invoices.map(i => i.invoiceNumber);
      const unique = new Set(numbers);

      if (numbers.length === unique.size) {
        console.log('✅ Uniqueness: All invoice numbers unique');
        results.pass++;
      } else {
        console.log('❌ Uniqueness: Duplicate invoice numbers found');
        results.fail++;
      }

      // Check sequential
      let sequential = true;
      for (let i = 1; i < invoices.length; i++) {
        const prevNum = parseInt(invoices[i - 1].invoiceNumber.split('-')[2]);
        const currNum = parseInt(invoices[i].invoiceNumber.split('-')[2]);

        if (currNum !== prevNum + 1) {
          console.log(`⚠️  Gap: ${invoices[i - 1].invoiceNumber} → ${invoices[i].invoiceNumber}`);
          sequential = false;
        }
      }

      if (sequential) {
        console.log('✅ Sequential: Invoice numbers increment by 1');
        results.pass++;
      } else {
        console.log('⚠️  Non-Sequential: Gaps found in numbering');
        results.warn++;
      }
    }

    // ===================================================================
    // 2. PAYMENT NUMBERING
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2. PAYMENT NUMBERING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const paymentsSnapshot = await db.collection('tenants').doc(tenantId)
      .collection('payments').get();

    console.log(`Total Payments: ${paymentsSnapshot.size}\n`);

    if (paymentsSnapshot.size > 0) {
      const payments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const numA = parseInt(a.paymentNumber?.split('-')[2] || '0');
        const numB = parseInt(b.paymentNumber?.split('-')[2] || '0');
        return numA - numB;
      });

      console.log('Payment Numbers (sorted):');
      payments.forEach((pay, i) => {
        console.log(`  ${i + 1}. ${pay.paymentNumber} (${pay.status})`);
      });

      // Check format: PAY-YYYY-NNNN
      let formatValid = true;
      const regex = /^PAY-\d{4}-\d{4}$/;

      payments.forEach(pay => {
        if (!regex.test(pay.paymentNumber)) {
          console.log(`\n⚠️  ${pay.paymentNumber}: Invalid format (expected PAY-YYYY-NNNN)`);
          formatValid = false;
        }
      });

      if (formatValid) {
        console.log('\n✅ Format Valid: All payments follow PAY-YYYY-NNNN pattern');
        results.pass++;
      } else {
        console.log('\n❌ Format Invalid: Some payments have wrong format');
        results.fail++;
      }

      // Check uniqueness
      const numbers = payments.map(p => p.paymentNumber);
      const unique = new Set(numbers);

      if (numbers.length === unique.size) {
        console.log('✅ Uniqueness: All payment numbers unique');
        results.pass++;
      } else {
        console.log('❌ Uniqueness: Duplicate payment numbers found');
        results.fail++;
      }
    }

    // ===================================================================
    // 3. EXPENSE NUMBERING
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. EXPENSE NUMBERING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const expensesSnapshot = await db.collection('tenants').doc(tenantId)
      .collection('expenses').get();

    console.log(`Total Expenses: ${expensesSnapshot.size}\n`);

    if (expensesSnapshot.size > 0) {
      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const numA = parseInt(a.expenseNumber?.split('-')[2] || '0');
        const numB = parseInt(b.expenseNumber?.split('-')[2] || '0');
        return numA - numB;
      });

      console.log('Expense Numbers (sorted):');
      expenses.forEach((exp, i) => {
        console.log(`  ${i + 1}. ${exp.expenseNumber}`);
      });

      // Check format: EXP-YYYY-NNNN
      let formatValid = true;
      const regex = /^EXP-\d{4}-\d{4}$/;

      expenses.forEach(exp => {
        if (!regex.test(exp.expenseNumber)) {
          console.log(`\n⚠️  ${exp.expenseNumber}: Invalid format (expected EXP-YYYY-NNNN)`);
          formatValid = false;
        }
      });

      if (formatValid) {
        console.log('\n✅ Format Valid: All expenses follow EXP-YYYY-NNNN pattern');
        results.pass++;
      } else {
        console.log('\n❌ Format Invalid: Some expenses have wrong format');
        results.fail++;
      }

      // Check uniqueness
      const numbers = expenses.map(e => e.expenseNumber);
      const unique = new Set(numbers);

      if (numbers.length === unique.size) {
        console.log('✅ Uniqueness: All expense numbers unique');
        results.pass++;
      } else {
        console.log('❌ Uniqueness: Duplicate expense numbers found');
        results.fail++;
      }
    }

    // ===================================================================
    // 4. JOURNAL ENTRY NUMBERING
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4. JOURNAL ENTRY NUMBERING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const journalSnapshot = await db.collection('tenants').doc(tenantId)
      .collection('journalEntries').get();

    console.log(`Total Journal Entries: ${journalSnapshot.size}\n`);

    if (journalSnapshot.size > 0) {
      const entries = journalSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const numA = parseInt(a.entryNumber?.split('-')[2] || '0');
        const numB = parseInt(b.entryNumber?.split('-')[2] || '0');
        return numA - numB;
      });

      console.log('Journal Entry Numbers (sorted):');
      entries.forEach((entry, i) => {
        console.log(`  ${i + 1}. ${entry.entryNumber} (${entry.sourceType})`);
      });

      // Check format: JE-YYYY-NNNN
      let formatValid = true;
      const regex = /^JE-\d{4}-\d{4}$/;

      entries.forEach(entry => {
        if (!regex.test(entry.entryNumber)) {
          console.log(`\n⚠️  ${entry.entryNumber}: Invalid format (expected JE-YYYY-NNNN)`);
          formatValid = false;
        }
      });

      if (formatValid) {
        console.log('\n✅ Format Valid: All journal entries follow JE-YYYY-NNNN pattern');
        results.pass++;
      } else {
        console.log('\n❌ Format Invalid: Some entries have wrong format');
        results.fail++;
      }

      // Check uniqueness
      const numbers = entries.map(e => e.entryNumber);
      const unique = new Set(numbers);

      if (numbers.length === unique.size) {
        console.log('✅ Uniqueness: All journal entry numbers unique');
        results.pass++;
      } else {
        console.log('❌ Uniqueness: Duplicate journal entry numbers found');
        results.fail++;
      }

      // Check sequential
      let sequential = true;
      for (let i = 1; i < entries.length; i++) {
        const prevNum = parseInt(entries[i - 1].entryNumber.split('-')[2]);
        const currNum = parseInt(entries[i].entryNumber.split('-')[2]);

        if (currNum !== prevNum + 1) {
          console.log(`⚠️  Gap: ${entries[i - 1].entryNumber} → ${entries[i].entryNumber}`);
          sequential = false;
        }
      }

      if (sequential) {
        console.log('✅ Sequential: Journal entry numbers increment by 1');
        results.pass++;
      } else {
        console.log('⚠️  Non-Sequential: Gaps found in numbering');
        results.warn++;
      }
    }

    // ===================================================================
    // SUMMARY
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TRANSACTION NUMBERING SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const totalChecks = results.pass + results.fail + results.warn;
    const score = ((results.pass / (totalChecks - results.warn)) * 100).toFixed(1);

    console.log(`Total Checks: ${totalChecks}`);
    console.log(`  ✅ Passed: ${results.pass}`);
    console.log(`  ❌ Failed: ${results.fail}`);
    console.log(`  ⚠️  Warnings: ${results.warn}`);
    console.log();
    console.log(`Transaction Numbering Health: ${score}%`);
    console.log();

    if (results.fail === 0) {
      console.log('✅ EXCELLENT: All transaction numbering checks passed!');
    } else {
      console.log('❌ ISSUES FOUND: Some transaction numbers have problems');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

verifyTransactionNumbering().then(() => process.exit(0));
