const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyPaymentInvoice() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';
    const paymentId = '0BVkOBSeOocWIVRU0IPp';
    const customerId = 'xjo4VhrDYyz0FO44Oq1D';

    console.log('\n=== Payment-Invoice-Account Reconciliation ===\n');

    // Get payment
    const paymentDoc = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('payments')
      .doc(paymentId)
      .get();

    const payment = paymentDoc.data();
    console.log('PAYMENT:');
    console.log(`  Number: ${payment.paymentNumber}`);
    console.log(`  Amount: ${payment.amount} ${payment.currency}`);
    console.log(`  Invoice ID: ${payment.invoiceId || 'None'}`);
    console.log(`  Method: ${payment.method}`);

    // Get invoice if linked
    let invoice = null;
    if (payment.invoiceId) {
      const invoiceDoc = await db
        .collection('tenants')
        .doc(tenantId)
        .collection('invoices')
        .doc(payment.invoiceId)
        .get();

      if (invoiceDoc.exists) {
        invoice = invoiceDoc.data();
        console.log('\nINVOICE:');
        console.log(`  Number: ${invoice.invoiceNumber}`);
        console.log(`  Total: ${invoice.total} ${invoice.currency}`);
        console.log(`  Status: ${invoice.status}`);
      }
    }

    // Get customer account
    const accountsSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('accounts')
      .get();

    let customerAccount = null;
    let cashAccount = null;

    accountsSnapshot.docs.forEach(doc => {
      const account = doc.data();
      if (account.linkedEntityId === customerId && account.name.includes('Receivable')) {
        customerAccount = { id: doc.id, ...account };
      }
      if (account.code === '1001') {
        cashAccount = { id: doc.id, ...account };
      }
    });

    console.log('\nACCOUNTS:');
    if (customerAccount) {
      console.log(`  Customer AR (${customerAccount.code}): ${customerAccount.balance} ${payment.currency}`);
    }
    if (cashAccount) {
      console.log(`  Cash (${cashAccount.code}): ${cashAccount.balance} ${payment.currency}`);
    }

    // Analysis
    console.log('\n=== ANALYSIS ===\n');

    if (invoice) {
      console.log(`Invoice Total: ${invoice.total} ${payment.currency}`);
      console.log(`Payment Amount: ${payment.amount} ${payment.currency}`);

      if (payment.amount === invoice.total) {
        console.log('✅ Payment amount matches invoice total (full payment)');
      } else if (payment.amount < invoice.total) {
        console.log(`⚠️  Partial payment: ${payment.amount}/${invoice.total} ${payment.currency}`);
      } else {
        console.log(`❌ Overpayment: ${payment.amount} > ${invoice.total} ${payment.currency}`);
      }

      console.log(`\nInvoice Status: ${invoice.status}`);
      if (payment.amount >= invoice.total && invoice.status === 'paid') {
        console.log('✅ Invoice correctly marked as paid');
      } else if (payment.amount < invoice.total && invoice.status === 'partiallyPaid') {
        console.log('✅ Invoice correctly marked as partially paid');
      } else {
        console.log(`⚠️  Invoice status may be incorrect for payment amount`);
      }
    }

    // Check if journal entry would be correct
    console.log('\n=== EXPECTED JOURNAL ENTRY ===');
    console.log('If journal entry was created, it should show:');
    console.log(`  DR: Cash (1001)          ${payment.amount} ${payment.currency}`);
    console.log(`  CR: AR - Customer (${customerAccount?.code || '????'})   ${payment.amount} ${payment.currency}`);

    console.log('\n=== EXPECTED BALANCE CHANGES ===');
    console.log('After payment is recorded:');
    console.log(`  Cash balance should INCREASE by ${payment.amount} ${payment.currency}`);
    console.log(`  Customer AR balance should DECREASE by ${payment.amount} ${payment.currency}`);

    console.log('\n⚠️  NOTE: BUG-010 prevents verification');
    console.log('Since journal entries are not created, balances may not update correctly.');

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyPaymentInvoice().then(() => process.exit(0));
