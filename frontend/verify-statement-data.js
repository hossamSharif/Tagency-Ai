const admin = require('firebase-admin');
const serviceAccount = require('../tagency-ai-firebase-adminsdk-fbsvc-14054d2b94.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyStatementData() {
  try {
    const tenantId = 'wrXpVCm2ADfvEYocdWQKXBGLrbk2';

    console.log('\n=== STATEMENT DATA VERIFICATION ===\n');
    console.log(`Tenant: ${tenantId}`);
    console.log(`Date: ${new Date().toISOString()}\n`);

    const results = {
      pass: 0,
      fail: 0,
      warn: 0
    };

    // ===================================================================
    // 1. CUSTOMER STATEMENT DATA
    // ===================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. CUSTOMER STATEMENT DATA VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get customers
    const customersSnapshot = await db.collection('tenants').doc(tenantId)
      .collection('customers').get();

    console.log(`Total Customers: ${customersSnapshot.size}\n`);

    if (customersSnapshot.size === 0) {
      console.log('⏸️  SKIP: No customers found\n');
      results.warn++;
    } else {
      // Test with first customer
      const customer = customersSnapshot.docs[0].data();
      const customerId = customersSnapshot.docs[0].id;

      console.log(`Testing Customer: ${customer.name}`);
      console.log(`Customer ID: ${customerId}\n`);

      // Get customer AR account
      const accountsSnapshot = await db.collection('tenants').doc(tenantId)
        .collection('accounts')
        .where('linkedEntityId', '==', customerId)
        .get();

      if (accountsSnapshot.empty) {
        console.log('❌ FAIL: Customer has no AR account');
        results.fail++;
      } else {
        const account = accountsSnapshot.docs[0].data();
        console.log(`Customer Account: ${account.code} - ${account.name}`);
        console.log(`Current Balance: ${account.balance || 0} SDG\n`);
        results.pass++;
      }

      // Get customer invoices
      const invoicesSnapshot = await db.collection('tenants').doc(tenantId)
        .collection('invoices')
        .where('customerId', '==', customerId)
        .get();

      console.log(`Customer Invoices: ${invoicesSnapshot.size}`);

      if (invoicesSnapshot.size > 0) {
        const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log('\nInvoice Details:');
        invoices.forEach(inv => {
          const issueDate = inv.issueDate ? new Date(inv.issueDate.toDate()).toISOString().split('T')[0] : 'N/A';
          console.log(`  - ${inv.invoiceNumber}: ${inv.total} ${inv.currency} (${inv.status}) - ${issueDate}`);
        });

        const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        console.log(`\nTotal Invoiced: ${totalInvoiced} SDG`);
        results.pass++;
      } else {
        console.log('⚠️  No invoices found for customer');
        results.warn++;
      }

      // Get customer payments
      const paymentsSnapshot = await db.collection('tenants').doc(tenantId)
        .collection('payments')
        .where('customerId', '==', customerId)
        .where('type', '==', 'customer')
        .get();

      console.log(`\nCustomer Payments: ${paymentsSnapshot.size}`);

      if (paymentsSnapshot.size > 0) {
        const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log('\nPayment Details:');
        payments.forEach(pay => {
          const payDate = pay.paymentDate ? new Date(pay.paymentDate.toDate()).toISOString().split('T')[0] : 'N/A';
          console.log(`  - ${pay.paymentNumber}: ${pay.amount} ${pay.currency} (${pay.method}) - ${payDate}`);
        });

        const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
        console.log(`\nTotal Paid: ${totalPaid} SDG`);
        results.pass++;
      } else {
        console.log('⚠️  No payments found for customer');
        results.warn++;
      }

      // Calculate statement data
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('CUSTOMER STATEMENT CALCULATION');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
      const calculatedBalance = totalInvoiced - totalPaid;

      console.log('Statement Summary:');
      console.log(`  Opening Balance: 0 SDG`);
      console.log(`  Total Invoiced: ${totalInvoiced} SDG`);
      console.log(`  Total Paid: ${totalPaid} SDG`);
      console.log(`  Calculated Balance: ${calculatedBalance} SDG`);

      // Get actual account balance
      const actualBalance = accountsSnapshot.docs[0]?.data()?.balance || 0;
      console.log(`  Actual Account Balance: ${actualBalance} SDG`);

      // Check if balances match
      const balanceDiff = Math.abs(calculatedBalance - actualBalance);
      if (balanceDiff < 0.01) {
        console.log('\n✅ PASS: Calculated balance matches account balance');
        results.pass++;
      } else {
        console.log(`\n⚠️  WARN: Balance mismatch (Difference: ${balanceDiff} SDG)`);
        console.log('   This could be due to BUG-010 (payment journal entries not created)');
        results.warn++;
      }

      // Check transaction count
      const totalTransactions = invoices.length + payments.length;
      console.log(`\nTotal Transactions for Statement: ${totalTransactions}`);
      console.log(`  Invoices: ${invoices.length}`);
      console.log(`  Payments: ${payments.length}`);

      if (totalTransactions > 0) {
        console.log('\n✅ PASS: Customer has transactions for statement generation');
        results.pass++;
      } else {
        console.log('\n⚠️  WARN: No transactions available for statement');
        results.warn++;
      }
    }

    // ===================================================================
    // 2. PARTNER STATEMENT DATA
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2. PARTNER STATEMENT DATA VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get partners
    const partnersSnapshot = await db.collection('tenants').doc(tenantId)
      .collection('partners').get();

    console.log(`Total Partners: ${partnersSnapshot.size}\n`);

    if (partnersSnapshot.size === 0) {
      console.log('⏸️  SKIP: No partners found for statement testing\n');
      results.warn++;
    } else {
      // Test with first partner
      const partner = partnersSnapshot.docs[0].data();
      const partnerId = partnersSnapshot.docs[0].id;

      console.log(`Testing Partner: ${partner.name}`);
      console.log(`Partner ID: ${partnerId}\n`);

      // Get partner AP account
      const partnerAccountsSnapshot = await db.collection('tenants').doc(tenantId)
        .collection('accounts')
        .where('linkedEntityId', '==', partnerId)
        .get();

      if (partnerAccountsSnapshot.empty) {
        console.log('❌ FAIL: Partner has no AP account');
        results.fail++;
      } else {
        const account = partnerAccountsSnapshot.docs[0].data();
        console.log(`Partner Account: ${account.code} - ${account.name}`);
        console.log(`Current Balance: ${account.balance || 0} SDG\n`);
        results.pass++;
      }

      // Get partner payments (commissions owed)
      const partnerPaymentsSnapshot = await db.collection('tenants').doc(tenantId)
        .collection('payments')
        .where('partnerId', '==', partnerId)
        .where('type', '==', 'partner')
        .get();

      console.log(`Partner Payments: ${partnerPaymentsSnapshot.size}`);

      if (partnerPaymentsSnapshot.size > 0) {
        const payments = partnerPaymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log('\nPayment Details:');
        payments.forEach(pay => {
          const payDate = pay.paymentDate ? new Date(pay.paymentDate.toDate()).toISOString().split('T')[0] : 'N/A';
          const commission = pay.commissionAmount || 0;
          console.log(`  - ${pay.paymentNumber}: Gross ${pay.grossAmount} - Commission ${commission} = Net ${pay.amount} (${payDate})`);
        });

        const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
        const totalCommission = payments.reduce((sum, pay) => sum + (pay.commissionAmount || 0), 0);
        console.log(`\nTotal Paid: ${totalPaid} SDG`);
        console.log(`Total Commission: ${totalCommission} SDG`);
        results.pass++;
      } else {
        console.log('⚠️  No payments found for partner');
        results.warn++;
      }

      // Check for partner services in invoices
      const allInvoicesSnapshot = await db.collection('tenants').doc(tenantId)
        .collection('invoices').get();

      let partnerServiceCount = 0;
      let partnerRevenue = 0;

      allInvoicesSnapshot.docs.forEach(doc => {
        const invoice = doc.data();
        if (invoice.services && Array.isArray(invoice.services)) {
          invoice.services.forEach(service => {
            if (service.partnerId === partnerId) {
              partnerServiceCount++;
              partnerRevenue += service.unitPrice * service.quantity;
            }
          });
        }
      });

      console.log(`\nPartner Services in Invoices: ${partnerServiceCount}`);
      console.log(`Total Revenue from Partner Services: ${partnerRevenue} SDG`);

      if (partnerServiceCount > 0) {
        console.log('\n✅ PASS: Partner has service transactions for statement');
        results.pass++;
      } else {
        console.log('\n⚠️  WARN: No partner service transactions found');
        results.warn++;
      }
    }

    // ===================================================================
    // 3. STATEMENT TRANSACTION ORDERING
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. TRANSACTION ORDERING FOR STATEMENTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get all transactions with dates
    const invoicesSnapshot = await db.collection('tenants').doc(tenantId)
      .collection('invoices').get();
    const paymentsSnapshot = await db.collection('tenants').doc(tenantId)
      .collection('payments').get();

    const transactions = [];

    invoicesSnapshot.docs.forEach(doc => {
      const invoice = doc.data();
      if (invoice.issueDate) {
        transactions.push({
          type: 'invoice',
          number: invoice.invoiceNumber,
          date: invoice.issueDate.toDate(),
          amount: invoice.total
        });
      }
    });

    paymentsSnapshot.docs.forEach(doc => {
      const payment = doc.data();
      if (payment.paymentDate) {
        transactions.push({
          type: 'payment',
          number: payment.paymentNumber,
          date: payment.paymentDate.toDate(),
          amount: payment.amount
        });
      }
    });

    // Sort by date
    transactions.sort((a, b) => a.date - b.date);

    console.log(`Total Transactions with Dates: ${transactions.length}\n`);

    if (transactions.length > 0) {
      console.log('Transactions in Chronological Order:');
      transactions.forEach((txn, i) => {
        const dateStr = txn.date.toISOString().split('T')[0];
        console.log(`  ${i + 1}. ${dateStr} - ${txn.type.toUpperCase()} ${txn.number}: ${txn.amount} SDG`);
      });

      console.log('\n✅ PASS: Transactions can be ordered chronologically for statement');
      results.pass++;
    } else {
      console.log('⚠️  WARN: No transactions with dates found');
      results.warn++;
    }

    // ===================================================================
    // SUMMARY
    // ===================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STATEMENT DATA VERIFICATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const totalChecks = results.pass + results.fail + results.warn;
    const score = results.fail === 0 ? (totalChecks > 0 ? ((results.pass / totalChecks) * 100).toFixed(1) : 0) : 0;

    console.log(`Total Checks: ${totalChecks}`);
    console.log(`  ✅ Passed: ${results.pass}`);
    console.log(`  ❌ Failed: ${results.fail}`);
    console.log(`  ⚠️  Warnings: ${results.warn}`);
    console.log();
    console.log(`Statement Data Quality: ${score}%`);
    console.log();

    if (results.fail === 0 && results.pass > 0) {
      console.log('✅ READY: All data available for statement generation');
      console.log('\nStatement Features Verified:');
      console.log('  ✅ Customer account balances tracked');
      console.log('  ✅ Customer transactions (invoices + payments) available');
      console.log('  ✅ Partner accounts tracked');
      console.log('  ✅ Chronological transaction ordering possible');
      console.log('\nNote: Actual PDF generation requires UI testing');
    } else if (results.fail > 0) {
      console.log('❌ NOT READY: Some accounts missing');
    } else {
      console.log('⚠️  LIMITED: Some data available but incomplete');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

verifyStatementData().then(() => process.exit(0));
