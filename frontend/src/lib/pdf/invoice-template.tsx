// Service-Based Invoice PDF template using @react-pdf/renderer
// T044 [US1] Create invoice PDF generation for service-based invoices

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { Invoice } from '@/types/models/invoice';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  companyDetails: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  invoiceInfo: {
    textAlign: 'right',
    flex: 1,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#333',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 4,
  },
  customerInfo: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
    minHeight: 30,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    fontSize: 9,
    color: '#333',
  },
  col1: {
    flex: 3,
  },
  col2: {
    flex: 1,
    textAlign: 'right',
  },
  col3: {
    flex: 1.5,
    textAlign: 'right',
  },
  col4: {
    flex: 1.5,
    textAlign: 'right',
  },
  serviceDetails: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  totalsSection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  totalsTable: {
    width: '50%',
    minWidth: 200,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalsLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalsValue: {
    fontSize: 10,
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#1a1a1a',
    marginTop: 4,
    borderRadius: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fef2f2',
    marginTop: 4,
    borderRadius: 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  balanceValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  paidRow: {
    backgroundColor: '#f0fdf4',
  },
  paidLabel: {
    color: '#16a34a',
  },
  paidValue: {
    color: '#16a34a',
  },
  commissionSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#fef3c7',
  },
  commissionLabel: {
    fontSize: 9,
    color: '#92400e',
  },
  commissionValue: {
    fontSize: 9,
    color: '#92400e',
  },
  notesSection: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 10,
  },
  statusBadge: {
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusDraft: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  statusIssued: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  statusPartial: {
    backgroundColor: '#fef9c3',
    color: '#ca8a04',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 9,
    color: '#666',
    width: 70,
  },
  dateValue: {
    fontSize: 9,
    color: '#333',
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | Date | any): string {
  if (!date) return '';

  let dateObj: Date;

  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else if (date && typeof date === 'object' && 'seconds' in date) {
    dateObj = new Date(date.seconds * 1000);
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    dateObj = date.toDate();
  } else {
    return '';
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'draft':
      return styles.statusDraft;
    case 'issued':
      return styles.statusIssued;
    case 'paid':
      return styles.statusPaid;
    case 'partial':
      return styles.statusPartial;
    case 'cancelled':
      return styles.statusCancelled;
    default:
      return styles.statusDraft;
  }
}

export function InvoicePDF({
  invoice,
  companyName = 'Agency AI',
  companyAddress = '',
  companyPhone = '',
  companyEmail = '',
}: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>
              {companyAddress && `${companyAddress}\n`}
              {companyPhone && `Tel: ${companyPhone}\n`}
              {companyEmail && `Email: ${companyEmail}`}
            </Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
              <Text>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Invoice Date:</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.invoiceDate)}</Text>
          </View>
          {invoice.dueDate && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Due Date:</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
          {invoice.issuedAt && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Issued:</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.issuedAt)}</Text>
            </View>
          )}
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{invoice.customerName}</Text>
            <Text style={styles.customerDetail}>{invoice.customerEmail}</Text>
            {invoice.customerPhone && (
              <Text style={styles.customerDetail}>{invoice.customerPhone}</Text>
            )}
          </View>
        </View>

        {/* Line Items - Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.col1]}>Service</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.col3]}>Unit Price</Text>
              <Text style={[styles.tableHeaderCell, styles.col4]}>Total</Text>
            </View>
            {invoice.lineItems && invoice.lineItems.map((item: any, index: number) => (
              <View
                key={item.id || index}
                style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
              >
                <View style={styles.col1}>
                  <Text style={styles.tableCell}>{item.serviceName}</Text>
                  {item.beneficiary && item.beneficiary.name && (
                    <Text style={styles.serviceDetails}>
                      Passenger: {item.beneficiary.name}
                    </Text>
                  )}
                  {item.isOutsourced && item.partnerName && (
                    <Text style={styles.serviceDetails}>
                      Provider: {item.partnerName}
                    </Text>
                  )}
                  {item.comments && (
                    <Text style={styles.serviceDetails}>{item.comments}</Text>
                  )}
                </View>
                <Text style={[styles.tableCell, styles.col2]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.col3]}>
                  {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={[styles.tableCell, styles.col4]}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.subtotal)}
              </Text>
            </View>
            {invoice.discount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Discount</Text>
                <Text style={styles.totalsValue}>
                  -{formatCurrency(invoice.discount)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.total)}
              </Text>
            </View>
            {invoice.status !== 'draft' && invoice.status !== 'cancelled' && (
              <>
                {invoice.paidAmount > 0 && (
                  <View style={[styles.balanceRow, styles.paidRow]}>
                    <Text style={[styles.balanceLabel, styles.paidLabel]}>Paid</Text>
                    <Text style={[styles.balanceValue, styles.paidValue]}>
                      {formatCurrency(invoice.paidAmount || 0)}
                    </Text>
                  </View>
                )}
                {invoice.balance > 0 && (
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Balance Due</Text>
                    <Text style={styles.balanceValue}>
                      {formatCurrency(invoice.balance)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Partner Commissions */}
        {invoice.totalCommissions > 0 && invoice.commissionsByPartner && (
          <View style={styles.commissionSection}>
            <Text style={styles.sectionTitle}>Partner Commissions</Text>
            {invoice.commissionsByPartner.map((comm: any) => (
              <View key={comm.partnerId} style={styles.commissionRow}>
                <Text style={styles.commissionLabel}>{comm.partnerName}</Text>
                <Text style={styles.commissionValue}>
                  {formatCurrency(comm.amount)}
                </Text>
              </View>
            ))}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total Commissions</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.totalCommissions)}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business</Text>
          <Text>{invoice.invoiceNumber} • Generated on {formatDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePDF;
