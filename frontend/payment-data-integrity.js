const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkPaymentDataIntegrity() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';

    console.log('\n=== PAYMENT DATA INTEGRITY CHECK ===\n');
    console.log(`Tenant: ${tenantId}\n`);

    // Get all payments
    const paymentsSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('payments')
      .get();

    console.log(`Total Payments: ${paymentsSnapshot.size}\n`);

    if (paymentsSnapshot.empty) {
      console.log('❌ No payments found');
      return;
    }

    const issues = [];
    let checksPerformed = 0;
    let checksPassed = 0;

    for (const paymentDoc of paymentsSnapshot.docs) {
      const payment = paymentDoc.data();
      const paymentId = paymentDoc.id;

      console.log(`\n--- Payment: ${payment.paymentNumber || 'NO NUMBER'} (ID: ${paymentId}) ---`);

      // Check 1: Payment number exists and follows format
      checksPerformed++;
      if (!payment.paymentNumber) {
        console.log('❌ Missing payment number');
        issues.push(`${paymentId}: Missing payment number`);
      } else if (!payment.paymentNumber.match(/^PAY-\d{4}-\d{4}$/)) {
        console.log(`❌ Invalid payment number format: ${payment.paymentNumber}`);
        issues.push(`${paymentId}: Invalid payment number format`);
      } else {
        console.log(`✅ Payment number: ${payment.paymentNumber}`);
        checksPassed++;
      }

      // Check 2: Amount is valid
      checksPerformed++;
      if (!payment.amount || payment.amount <= 0) {
        console.log(`❌ Invalid amount: ${payment.amount}`);
        issues.push(`${paymentId}: Invalid amount`);
      } else {
        console.log(`✅ Amount: ${payment.amount} ${payment.currency}`);
        checksPassed++;
      }

      // Check 3: Currency exists
      checksPerformed++;
      if (!payment.currency) {
        console.log('❌ Missing currency');
        issues.push(`${paymentId}: Missing currency`);
      } else {
        console.log(`✅ Currency: ${payment.currency}`);
        checksPassed++;
      }

      // Check 4: Payment method is valid
      checksPerformed++;
      const validMethods = ['cash', 'bankTransfer', 'card', 'check'];
      if (!payment.method || !validMethods.includes(payment.method)) {
        console.log(`❌ Invalid payment method: ${payment.method}`);
        issues.push(`${paymentId}: Invalid payment method`);
      } else {
        console.log(`✅ Method: ${payment.method}`);
        checksPassed++;
      }

      // Check 5: Status is valid
      checksPerformed++;
      const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
      if (!payment.status || !validStatuses.includes(payment.status)) {
        console.log(`❌ Invalid status: ${payment.status}`);
        issues.push(`${paymentId}: Invalid status`);
      } else {
        console.log(`✅ Status: ${payment.status}`);
        checksPassed++;
      }

      // Check 6: Customer exists if specified
      if (payment.customerId) {
        checksPerformed++;
        const customerDoc = await db
          .collection('tenants')
          .doc(tenantId)
          .collection('customers')
          .doc(payment.customerId)
          .get();

        if (!customerDoc.exists) {
          console.log(`❌ Customer ${payment.customerId} not found`);
          issues.push(`${paymentId}: Customer not found`);
        } else {
          console.log(`✅ Customer: ${customerDoc.data().name}`);
          checksPassed++;
        }
      }

      // Check 7: Invoice exists and amounts match
      if (payment.invoiceId) {
        checksPerformed++;
        const invoiceDoc = await db
          .collection('tenants')
          .doc(tenantId)
          .collection('invoices')
          .doc(payment.invoiceId)
          .get();

        if (!invoiceDoc.exists) {
          console.log(`❌ Invoice ${payment.invoiceId} not found`);
          issues.push(`${paymentId}: Linked invoice not found`);
        } else {
          const invoice = invoiceDoc.data();
          console.log(`✅ Invoice: ${invoice.invoiceNumber} (${invoice.total} ${invoice.currency})`);

          // Check if payment amount is valid for invoice
          checksPerformed++;
          if (payment.amount > invoice.total) {
            console.log(`⚠️  Overpayment: ${payment.amount} > ${invoice.total}`);
            issues.push(`${paymentId}: Overpayment (${payment.amount} > ${invoice.total})`);
          } else {
            checksPassed++;
          }

          // Check invoice status consistency
          checksPerformed++;
          const invoicePaymentsSnapshot = await db
            .collection('tenants')
            .doc(tenantId)
            .collection('payments')
            .where('invoiceId', '==', payment.invoiceId)
            .where('status', '==', 'completed')
            .get();

          let totalPaid = 0;
          invoicePaymentsSnapshot.docs.forEach(doc => {
            totalPaid += doc.data().amount;
          });

          const expectedStatus = totalPaid >= invoice.total ? 'paid' : 'partiallyPaid';
          if (invoice.status === expectedStatus) {
            console.log(`✅ Invoice status correct: ${invoice.status}`);
            checksPassed++;
          } else {
            console.log(`❌ Invoice status mismatch: ${invoice.status} (expected: ${expectedStatus})`);
            issues.push(`${paymentId}: Invoice status should be ${expectedStatus}, not ${invoice.status}`);
          }

          checksPassed++;
        }
      }

      // Check 8: Journal entry exists (should fail due to BUG-010)
      checksPerformed++;
      const journalSnapshot = await db
        .collection('tenants')
        .doc(tenantId)
        .collection('journalEntries')
        .where('sourceDocumentId', '==', paymentId)
        .where('sourceType', '==', 'payment')
        .get();

      if (journalSnapshot.empty) {
        console.log('❌ No journal entry found (BUG-010)');
        issues.push(`${paymentId}: Missing journal entry (BUG-010)`);
      } else {
        console.log(`✅ Journal entry exists: ${journalSnapshot.docs[0].data().entryNumber}`);
        checksPassed++;
      }

      // Check 9: Timestamps exist
      checksPerformed++;
      if (!payment.paymentDate) {
        console.log('❌ Missing payment date');
        issues.push(`${paymentId}: Missing payment date`);
      } else {
        console.log(`✅ Payment date: ${payment.paymentDate.toDate().toISOString()}`);
        checksPassed++;
      }

      checksPerformed++;
      if (!payment.createdAt) {
        console.log('❌ Missing createdAt');
        issues.push(`${paymentId}: Missing createdAt`);
      } else {
        checksPassed++;
      }
    }

    // Summary
    console.log('\n\n=== INTEGRITY CHECK SUMMARY ===\n');
    console.log(`Total Payments Checked: ${paymentsSnapshot.size}`);
    console.log(`Total Checks Performed: ${checksPerformed}`);
    console.log(`Checks Passed: ${checksPassed}`);
    console.log(`Checks Failed: ${checksPerformed - checksPassed}`);
    console.log(`Success Rate: ${((checksPassed / checksPerformed) * 100).toFixed(1)}%\n`);

    if (issues.length > 0) {
      console.log('=== ISSUES FOUND ===\n');
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
    } else {
      console.log('✅ No issues found (excluding known BUG-010)');
    }

    console.log('\n=== KNOWN ISSUES ===');
    console.log('BUG-010: Payments do not create journal entries');
    console.log('  Impact: All payments will fail journal entry check');
    console.log('  Status: Critical - breaks double-entry accounting');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaymentDataIntegrity().then(() => process.exit(0));
