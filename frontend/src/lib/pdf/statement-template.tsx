import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { AccountStatement } from '@/app/actions/statements';

// Register fonts
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
});

Font.register({
  family: 'Roboto-Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  accountInfo: {
    marginTop: 20,
    marginBottom: 20,
  },
  accountName: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginBottom: 5,
  },
  accountDetails: {
    fontSize: 11,
    color: '#666',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  summaryItem: {
    flexDirection: 'column',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 5,
    fontFamily: 'Roboto-Bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    fontSize: 9,
  },
  tableCol1: {
    width: '12%',
  },
  tableCol2: {
    width: '15%',
  },
  tableCol3: {
    width: '33%',
  },
  tableCol4: {
    width: '13%',
    textAlign: 'right',
  },
  tableCol5: {
    width: '13%',
    textAlign: 'right',
  },
  tableCol6: {
    width: '14%',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
    borderTop: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  noData: {
    textAlign: 'center',
    padding: 20,
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
});

interface StatementTemplateProps {
  statement: AccountStatement;
  workspaceName: string;
}

export function StatementTemplate({ statement, workspaceName }: StatementTemplateProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    // Always use 'en-US' locale for English numerals with thousand separators
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} ${currency}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Account Statement</Text>
          <Text style={styles.subtitle}>{workspaceName}</Text>
        </View>

        {/* Account Info */}
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>
            {statement.accountName}
            {statement.linkedEntityName && ` - ${statement.linkedEntityName}`}
          </Text>
          <Text style={styles.accountDetails}>
            Account {statement.accountCode} • {statement.accountType}
          </Text>
          <Text style={styles.accountDetails}>
            Period: {formatDate(statement.startDate)} to {formatDate(statement.endDate)}
          </Text>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Opening Balance</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(statement.openingBalance, statement.currency)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{statement.transactions.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Closing Balance</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(statement.closingBalance, statement.currency)}
            </Text>
          </View>
        </View>

        {/* Transactions Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>Date</Text>
            <Text style={styles.tableCol2}>Reference</Text>
            <Text style={styles.tableCol3}>Description</Text>
            <Text style={styles.tableCol4}>Debit</Text>
            <Text style={styles.tableCol5}>Credit</Text>
            <Text style={styles.tableCol6}>Balance</Text>
          </View>

          {statement.transactions.length === 0 ? (
            <Text style={styles.noData}>No transactions in this period</Text>
          ) : (
            statement.transactions.map((transaction, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCol1}>{formatDate(transaction.date)}</Text>
                <Text style={styles.tableCol2}>{transaction.reference}</Text>
                <Text style={styles.tableCol3}>{transaction.description}</Text>
                <Text style={styles.tableCol4}>
                  {transaction.debit > 0
                    ? formatCurrency(transaction.debit, statement.currency)
                    : '-'}
                </Text>
                <Text style={styles.tableCol5}>
                  {transaction.credit > 0
                    ? formatCurrency(transaction.credit, statement.currency)
                    : '-'}
                </Text>
                <Text style={styles.tableCol6}>
                  {formatCurrency(transaction.balance, statement.currency)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated on {new Date().toLocaleDateString()}</Text>
          <Text>
            This is a computer-generated statement and does not require a signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
