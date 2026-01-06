const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyPaymentJournal() {
  try {
    // Test tenant
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';
    const paymentId = '0BVkOBSeOocWIVRU0IPp';

    console.log('\n=== PAY-CUST-CRUD-9: Journal Entry Verification ===\n');

    // Get payment details
    const paymentDoc = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('payments')
      .doc(paymentId)
      .get();

    if (!paymentDoc.exists) {
      console.log('❌ Payment not found');
      return;
    }

    const payment = paymentDoc.data();
    console.log(`Payment: ${payment.paymentNumber}`);
    console.log(`Amount: ${payment.amount} ${payment.currency}`);
    console.log(`Method: ${payment.method}`);
    console.log(`Date: ${payment.paymentDate.toDate().toISOString()}`);

    // Find associated journal entry
    const journalSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('journalEntries')
      .where('sourceDocumentId', '==', paymentId)
      .where('sourceType', '==', 'payment')
      .get();

    if (journalSnapshot.empty) {
      console.log('\n❌ FAIL: No journal entry found for payment');
      console.log('Expected: Journal entry with DR: Cash/Bank, CR: Customer Account');
      return;
    }

    const journalEntry = journalSnapshot.docs[0].data();
    console.log(`\n✅ Journal Entry Found: ${journalEntry.entryNumber}`);
    console.log(`Entry Type: ${journalEntry.entryType}`);
    console.log(`Date: ${journalEntry.date.toDate().toISOString()}`);

    console.log('\nJournal Lines:');
    let totalDebit = 0;
    let totalCredit = 0;
    let hasCashDebit = false;
    let hasCustomerCredit = false;

    journalEntry.lines.forEach((line, i) => {
      console.log(`  ${i + 1}. ${line.accountCode} - ${line.accountName}`);
      console.log(`     Debit: ${line.debit || 0}, Credit: ${line.credit || 0}`);

      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;

      // Check for Cash/Bank debit (account 1001 or 1002)
      if ((line.accountCode === '1001' || line.accountCode === '1002') && line.debit > 0) {
        hasCashDebit = true;
      }

      // Check for Customer account credit (account type 1200)
      if (line.accountCode.startsWith('12') && line.credit > 0) {
        hasCustomerCredit = true;
      }
    });

    console.log(`\nTotal Debit: ${totalDebit}`);
    console.log(`Total Credit: ${totalCredit}`);
    console.log(`Balanced: ${totalDebit === totalCredit ? '✅ Yes' : '❌ No'}`);

    console.log('\nTest Criteria:');
    console.log(`  DR: Cash/Bank: ${hasCashDebit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  CR: Customer Account: ${hasCustomerCredit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Balanced Entry: ${totalDebit === totalCredit ? '✅ PASS' : '❌ FAIL'}`);

    if (hasCashDebit && hasCustomerCredit && totalDebit === totalCredit) {
      console.log('\n✅ PAY-CUST-CRUD-9: PASSED');
      console.log('Journal entry created correctly with DR: Cash/Bank, CR: Customer Account');
    } else {
      console.log('\n❌ PAY-CUST-CRUD-9: FAILED');
      console.log('Journal entry does not match expected pattern');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyPaymentJournal().then(() => process.exit(0));
