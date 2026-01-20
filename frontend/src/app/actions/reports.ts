'use server';

// Report server actions
// T259-T262 [US11] Reporting and Analytics Dashboard

import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { ActionResult } from '@/lib/actions/types';
import { Invoice } from '@/types/models/invoice';
import { Booking, BookingStatus } from '@/types/models/booking';
import { Package } from '@/types/models/package';
import { CurrencyCode } from '@/types/models/tenant';
import { ServiceType } from '@/types/models/service-catalog';

/**
 * Finance Dashboard Data
 */
export interface FinanceDashboardData {
  // Summary stats
  totalRevenue: number;
  totalInvoices: number;
  totalCustomers: number;
  activeServices: number;
  pendingPayments: number;
  pendingCommissions: number;
  currency: CurrencyCode;

  // Period comparison
  revenueChange: number; // percentage change from previous period
  invoicesChange: number;
  customersChange: number;

  // Revenue by month (for chart)
  revenueByMonth: {
    month: string;
    revenue: number;
    invoices: number;
  }[];

  // Service analytics
  mostUsedServices: {
    id: string;
    name: string;
    nameAr: string;
    type: ServiceType;
    usageCount: number;
  }[];

  serviceRevenueByType: {
    type: ServiceType;
    revenue: number;
    count: number;
  }[];

  servicesByType: Record<ServiceType, number>;

  // Recent activity
  recentActivity: {
    id: string;
    type: 'payment' | 'invoice';
    description: string;
    amount?: number;
    createdAt: Date;
  }[];
}

/**
 * Sales Report Data
 */
export interface SalesReportData {
  // Summary
  totalSales: number;
  totalInvoiced: number;
  totalCollected: number;
  outstandingBalance: number;
  currency: CurrencyCode;

  // By package type
  salesByPackageType: {
    type: string;
    count: number;
    amount: number;
  }[];

  // By month
  salesByMonth: {
    month: string;
    invoiced: number;
    collected: number;
    count: number;
  }[];

  // Top customers
  topCustomers: {
    id: string;
    name: string;
    totalSpent: number;
    bookingsCount: number;
  }[];

  // Invoices list
  invoices: {
    id: string;
    invoiceNumber: string;
    customerName: string;
    total: number;
    paidAmount: number;
    status: string;
    issueDate: Date;
  }[];
}

/**
 * Commission Report Data
 */
export interface CommissionReportData {
  // Summary
  totalCommissions: number;
  pendingCommissions: number;
  settledCommissions: number;
  currency: CurrencyCode;

  // By partner
  commissionsByPartner: {
    partnerId: string;
    partnerName: string;
    totalAmount: number;
    pendingAmount: number;
    settledAmount: number;
    servicesCount: number;
  }[];

  // By month
  commissionsByMonth: {
    month: string;
    total: number;
    settled: number;
  }[];

  // Recent settlements
  recentSettlements: {
    id: string;
    settlementNumber: string;
    partnerName: string;
    amount: number;
    status: string;
    createdAt: Date;
  }[];
}

/**
 * Customer Activity Report Data
 */
export interface CustomerActivityReportData {
  // Summary
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisPeriod: number;
  averageSpendPerCustomer: number;
  currency: CurrencyCode;

  // Customer acquisition over time
  customersByMonth: {
    month: string;
    newCustomers: number;
    totalCustomers: number;
  }[];

  // Customer segments by spending
  customerSegments: {
    segment: string;
    count: number;
    percentage: number;
  }[];

  // Most active customers
  mostActiveCustomers: {
    id: string;
    name: string;
    email: string;
    bookingsCount: number;
    totalSpent: number;
    lastBookingDate?: Date;
  }[];
}

/**
 * Date range filter
 */
export interface DateRange {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
}

/**
 * Helper to get start of month
 */
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Helper to format month key
 */
function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Helper to get previous period dates
 */
function getPreviousPeriod(startDate: Date, endDate: Date): { start: Date; end: Date } {
  const diff = endDate.getTime() - startDate.getTime();
  return {
    start: new Date(startDate.getTime() - diff),
    end: new Date(startDate.getTime() - 1),
  };
}

/**
 * T259 [US11] Get finance dashboard data
 */
export async function getFinanceDashboardAction(
  tenantId: string,
  dateRange?: DateRange
): Promise<ActionResult<FinanceDashboardData>> {
  try {
    // Set default date range (last 12 months)
    const endDate = dateRange?.endDate
      ? new Date(dateRange.endDate)
      : new Date();
    const startDate = dateRange?.startDate
      ? new Date(dateRange.startDate)
      : new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Get previous period for comparison
    const prevPeriod = getPreviousPeriod(startDate, endDate);
    const prevStartTimestamp = Timestamp.fromDate(prevPeriod.start);
    const prevEndTimestamp = Timestamp.fromDate(prevPeriod.end);

    // Get tenant for currency
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    const currency = (tenantDoc.data()?.currency || 'USD') as CurrencyCode;

    // Fetch all required data in parallel
    const [
      invoicesSnapshot,
      customersSnapshot,
      servicesSnapshot,
      paymentsSnapshot,
      settlementsSnapshot,
      prevInvoicesSnapshot,
      prevCustomersSnapshot,
    ] = await Promise.all([
      // Current period
      adminDb
        .collection(`tenants/${tenantId}/invoices`)
        .where('createdAt', '>=', startTimestamp)
        .where('createdAt', '<=', endTimestamp)
        .get(),
      adminDb.collection(`tenants/${tenantId}/customers`).get(),
      adminDb
        .collection(`tenants/${tenantId}/serviceCatalog`)
        .where('isActive', '==', true)
        .get(),
      adminDb
        .collection(`tenants/${tenantId}/payments`)
        .where('status', '==', 'pending')
        .get(),
      adminDb
        .collection(`tenants/${tenantId}/commissionSettlements`)
        .where('status', '==', 'pending')
        .get(),
      // Previous period for comparison
      adminDb
        .collection(`tenants/${tenantId}/invoices`)
        .where('createdAt', '>=', prevStartTimestamp)
        .where('createdAt', '<=', prevEndTimestamp)
        .get(),
      adminDb
        .collection(`tenants/${tenantId}/customers`)
        .where('createdAt', '>=', prevStartTimestamp)
        .where('createdAt', '<=', prevEndTimestamp)
        .get(),
    ]);

    // Calculate current period totals
    const invoices = invoicesSnapshot.docs.map(doc => doc.data() as Invoice);
    const services = servicesSnapshot.docs.map(doc => doc.data());

    // Use invoice total (not paidAmount) to show full service revenue
    const totalRevenue = invoices
      .filter(inv => inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const totalInvoices = invoices.filter(inv => inv.status !== 'cancelled').length;
    const totalCustomers = customersSnapshot.size;
    const activeServices = services.length;

    // Calculate pending payments
    const pendingPayments = paymentsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().amount || 0);
    }, 0);

    // Calculate pending commissions
    const pendingCommissions = settlementsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().totalAmount || 0);
    }, 0);

    // Calculate previous period totals for comparison
    const prevInvoices = prevInvoicesSnapshot.docs.map(doc => doc.data() as Invoice);
    const prevRevenue = prevInvoices
      .filter(inv => inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const prevInvoicesCount = prevInvoices.filter(inv => inv.status !== 'cancelled').length;
    const prevCustomersCount = prevCustomersSnapshot.size;

    // Calculate percentage changes
    const revenueChange = prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : 0;
    const invoicesChange = prevInvoicesCount > 0
      ? ((totalInvoices - prevInvoicesCount) / prevInvoicesCount) * 100
      : 0;
    const customersChange = prevCustomersCount > 0
      ? ((totalCustomers - prevCustomersCount) / prevCustomersCount) * 100
      : 0;

    // Revenue by month
    const revenueByMonthMap = new Map<string, { revenue: number; invoices: number }>();

    // Initialize months
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const key = formatMonthKey(monthDate);
      revenueByMonthMap.set(key, { revenue: 0, invoices: 0 });
    }

    // Populate with invoice data - use total (not paidAmount) to show full service revenue
    invoices.forEach(inv => {
      if (inv.status !== 'cancelled' && inv.createdAt) {
        const date = inv.createdAt.toDate();
        const key = formatMonthKey(date);
        const existing = revenueByMonthMap.get(key);
        if (existing) {
          existing.revenue += inv.total || 0;
          existing.invoices += 1;
        }
      }
    });

    const revenueByMonth = Array.from(revenueByMonthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Service analytics

    // Most used services (top 5 by usage count)
    const mostUsedServices = services
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5)
      .map(service => ({
        id: service.id,
        name: service.name,
        nameAr: service.nameAr,
        type: service.type as ServiceType,
        usageCount: service.usageCount || 0,
      }));

    // Service revenue by type (aggregate from invoice line items)
    const serviceRevenueMap = new Map<ServiceType, { revenue: number; count: number }>();

    invoices.forEach(invoice => {
      if (invoice.status !== 'cancelled' && invoice.lineItems) {
        invoice.lineItems.forEach(item => {
          const type = (item.serviceType || 'other') as ServiceType;
          const existing = serviceRevenueMap.get(type) || { revenue: 0, count: 0 };
          existing.revenue += item.total || 0;
          existing.count += 1;
          serviceRevenueMap.set(type, existing);
        });
      }
    });

    const serviceRevenueByType = Array.from(serviceRevenueMap.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Services by type (distribution of active services)
    const servicesByType: Record<ServiceType, number> = {
      visa: 0,
      ticket: 0,
      hotel: 0,
      insurance: 0,
      other: 0,
    };

    services.forEach(service => {
      const type = service.type as ServiceType;
      servicesByType[type] = (servicesByType[type] || 0) + 1;
    });

    // Recent activity (invoices and payments only)
    const recentActivity: FinanceDashboardData['recentActivity'] = [];

    // Add recent invoices
    invoices
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .forEach(inv => {
        recentActivity.push({
          id: inv.id,
          type: 'invoice',
          description: `Invoice ${inv.invoiceNumber} - ${inv.customerName}`,
          amount: inv.total,
          createdAt: inv.createdAt?.toDate?.() || new Date(),
        });
      });

    // Add recent payments
    const recentPaymentsSnapshot = await adminDb
      .collection(`tenants/${tenantId}/payments`)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    recentPaymentsSnapshot.docs.forEach(doc => {
      const payment = doc.data();
      recentActivity.push({
        id: doc.id,
        type: 'payment',
        description: `Payment received - ${payment.customerName || 'Customer'}`,
        amount: payment.amount,
        createdAt: payment.createdAt?.toDate?.() || new Date(),
      });
    });

    // Sort combined activity
    recentActivity.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      success: true,
      data: {
        totalRevenue,
        totalInvoices,
        totalCustomers,
        activeServices,
        pendingPayments,
        pendingCommissions,
        currency,
        revenueChange: Math.round(revenueChange * 10) / 10,
        invoicesChange: Math.round(invoicesChange * 10) / 10,
        customersChange: Math.round(customersChange * 10) / 10,
        revenueByMonth,
        mostUsedServices,
        serviceRevenueByType,
        servicesByType,
        recentActivity: recentActivity.slice(0, 10),
      },
    };
  } catch (error) {
    console.error('Error fetching finance dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
    };
  }
}

/**
 * T260 [US11] Get sales report data
 */
export async function getSalesReportAction(
  tenantId: string,
  dateRange?: DateRange
): Promise<ActionResult<SalesReportData>> {
  try {
    // Set default date range (last 12 months)
    const endDate = dateRange?.endDate
      ? new Date(dateRange.endDate)
      : new Date();
    const startDate = dateRange?.startDate
      ? new Date(dateRange.startDate)
      : new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Get tenant for currency
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    const currency = (tenantDoc.data()?.currency || 'USD') as CurrencyCode;

    // Fetch invoices and bookings
    const [invoicesSnapshot, bookingsSnapshot, customersSnapshot] = await Promise.all([
      adminDb
        .collection(`tenants/${tenantId}/invoices`)
        .where('createdAt', '>=', startTimestamp)
        .where('createdAt', '<=', endTimestamp)
        .get(),
      adminDb
        .collection(`tenants/${tenantId}/bookings`)
        .where('createdAt', '>=', startTimestamp)
        .where('createdAt', '<=', endTimestamp)
        .get(),
      adminDb.collection(`tenants/${tenantId}/customers`).get(),
    ]);

    const invoices = invoicesSnapshot.docs.map(doc => doc.data() as Invoice);
    const bookings = bookingsSnapshot.docs.map(doc => doc.data() as Booking);
    const customersMap = new Map(customersSnapshot.docs.map(doc => [doc.id, doc.data()]));

    // Calculate totals
    const validInvoices = invoices.filter(inv => inv.status !== 'cancelled');
    const totalSales = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalInvoiced = validInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCollected = validInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const outstandingBalance = totalInvoiced - totalCollected;

    // Sales by package type
    const salesByTypeMap = new Map<string, { count: number; amount: number }>();

    bookings.forEach(booking => {
      const type = booking.packageSnapshot?.type || 'custom';
      const existing = salesByTypeMap.get(type);
      if (existing) {
        existing.count += 1;
        existing.amount += booking.totalAmount || 0;
      } else {
        salesByTypeMap.set(type, { count: 1, amount: booking.totalAmount || 0 });
      }
    });

    const salesByPackageType = Array.from(salesByTypeMap.entries())
      .map(([type, data]) => ({ type, ...data }));

    // Sales by month
    const salesByMonthMap = new Map<string, { invoiced: number; collected: number; count: number }>();

    // Initialize months
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const key = formatMonthKey(monthDate);
      salesByMonthMap.set(key, { invoiced: 0, collected: 0, count: 0 });
    }

    // Populate with invoice data
    validInvoices.forEach(inv => {
      if (inv.createdAt) {
        const date = inv.createdAt.toDate();
        const key = formatMonthKey(date);
        const existing = salesByMonthMap.get(key);
        if (existing) {
          existing.invoiced += inv.total;
          existing.collected += inv.paidAmount || 0;
          existing.count += 1;
        }
      }
    });

    const salesByMonth = Array.from(salesByMonthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top customers
    const customerStatsMap = new Map<string, { name: string; totalSpent: number; bookingsCount: number }>();

    invoices.forEach(inv => {
      if (inv.status !== 'cancelled') {
        const existing = customerStatsMap.get(inv.customerId);
        const customer = customersMap.get(inv.customerId);
        const name = inv.customerName || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Unknown';

        if (existing) {
          existing.totalSpent += inv.paidAmount || 0;
          existing.bookingsCount += 1;
        } else {
          customerStatsMap.set(inv.customerId, {
            name,
            totalSpent: inv.paidAmount || 0,
            bookingsCount: 1,
          });
        }
      }
    });

    const topCustomers = Array.from(customerStatsMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Invoice list
    const invoiceList = validInvoices
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 50)
      .map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName || 'Unknown',
        total: inv.total,
        paidAmount: inv.paidAmount || 0,
        status: inv.status,
        issueDate: inv.issueDate?.toDate?.() || new Date(),
      }));

    return {
      success: true,
      data: {
        totalSales,
        totalInvoiced,
        totalCollected,
        outstandingBalance,
        currency,
        salesByPackageType,
        salesByMonth,
        topCustomers,
        invoices: invoiceList,
      },
    };
  } catch (error) {
    console.error('Error fetching sales report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales report',
    };
  }
}

/**
 * T261 [US11] Get commission report data
 */
export async function getCommissionReportAction(
  tenantId: string,
  dateRange?: DateRange
): Promise<ActionResult<CommissionReportData>> {
  try {
    // Set default date range (last 12 months)
    const endDate = dateRange?.endDate
      ? new Date(dateRange.endDate)
      : new Date();
    const startDate = dateRange?.startDate
      ? new Date(dateRange.startDate)
      : new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Get tenant for currency
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    const currency = (tenantDoc.data()?.currency || 'USD') as CurrencyCode;

    // Fetch invoices and settlements
    const [invoicesSnapshot, settlementsSnapshot, partnersSnapshot] = await Promise.all([
      adminDb
        .collection(`tenants/${tenantId}/invoices`)
        .where('createdAt', '>=', startTimestamp)
        .where('createdAt', '<=', endTimestamp)
        .get(),
      adminDb
        .collection(`tenants/${tenantId}/commissionSettlements`)
        .where('createdAt', '>=', startTimestamp)
        .where('createdAt', '<=', endTimestamp)
        .get(),
      adminDb.collection(`tenants/${tenantId}/partnerOffices`).get(),
    ]);

    const invoices = invoicesSnapshot.docs.map(doc => doc.data() as Invoice);
    const settlements = settlementsSnapshot.docs.map(doc => doc.data());
    const partnersMap = new Map(partnersSnapshot.docs.map(doc => [doc.id, doc.data()]));

    // Calculate commission totals from invoices
    const validInvoices = invoices.filter(inv => inv.status !== 'cancelled');
    const totalCommissions = validInvoices.reduce((sum, inv) => sum + (inv.totalCommissions || 0), 0);

    // Calculate settled and pending from settlements
    const settledCommissions = settlements
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    const pendingCommissions = settlements
      .filter(s => s.status === 'pending' || s.status === 'approved')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // Commissions by partner
    const partnerStatsMap = new Map<string, {
      partnerName: string;
      totalAmount: number;
      pendingAmount: number;
      settledAmount: number;
      servicesCount: number;
    }>();

    // Aggregate from invoices
    validInvoices.forEach(inv => {
      inv.commissionsByPartner?.forEach(comm => {
        // Ensure we have valid data to work with
        const commAmount = Number(comm.totalAmount) || 0;
        const partnerId = comm.partnerOfficeId;

        if (!partnerId) return; // Skip if no partner ID

        // Get partner name from commission data or lookup from partners collection
        const partnerData = partnersMap.get(partnerId);
        const partnerName = comm.partnerOfficeName ||
          (partnerData as { name?: string })?.name ||
          'Unknown';

        const existing = partnerStatsMap.get(partnerId);
        if (existing) {
          existing.totalAmount += commAmount;
          if (comm.status === 'pending') {
            existing.pendingAmount += commAmount;
          } else {
            existing.settledAmount += commAmount;
          }
          existing.servicesCount += 1;
        } else {
          partnerStatsMap.set(partnerId, {
            partnerName,
            totalAmount: commAmount,
            pendingAmount: comm.status === 'pending' ? commAmount : 0,
            settledAmount: comm.status !== 'pending' ? commAmount : 0,
            servicesCount: 1,
          });
        }
      });
    });

    const commissionsByPartner = Array.from(partnerStatsMap.entries())
      .map(([partnerId, data]) => ({ partnerId, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Commissions by month
    const commissionsByMonthMap = new Map<string, { total: number; settled: number }>();

    // Initialize months
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const key = formatMonthKey(monthDate);
      commissionsByMonthMap.set(key, { total: 0, settled: 0 });
    }

    // Populate from invoices
    validInvoices.forEach(inv => {
      if (inv.createdAt && inv.totalCommissions) {
        const date = inv.createdAt.toDate();
        const key = formatMonthKey(date);
        const existing = commissionsByMonthMap.get(key);
        if (existing) {
          existing.total += inv.totalCommissions;
        }
      }
    });

    // Populate settled from settlements
    settlements.forEach(settlement => {
      if (settlement.createdAt && settlement.status === 'paid') {
        const date = settlement.createdAt.toDate();
        const key = formatMonthKey(date);
        const existing = commissionsByMonthMap.get(key);
        if (existing) {
          existing.settled += settlement.totalAmount || 0;
        }
      }
    });

    const commissionsByMonth = Array.from(commissionsByMonthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Recent settlements
    const recentSettlements = settlements
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        settlementNumber: s.settlementNumber || 'N/A',
        partnerName: s.partnerOfficeName || 'Unknown',
        amount: s.totalAmount || 0,
        status: s.status,
        createdAt: s.createdAt?.toDate?.() || new Date(),
      }));

    return {
      success: true,
      data: {
        totalCommissions,
        pendingCommissions,
        settledCommissions,
        currency,
        commissionsByPartner,
        commissionsByMonth,
        recentSettlements,
      },
    };
  } catch (error) {
    console.error('Error fetching commission report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch commission report',
    };
  }
}

/**
 * T262 [US11] Get customer activity report data
 */
export async function getCustomerActivityReportAction(
  tenantId: string,
  dateRange?: DateRange
): Promise<ActionResult<CustomerActivityReportData>> {
  try {
    // Set default date range (last 12 months)
    const endDate = dateRange?.endDate
      ? new Date(dateRange.endDate)
      : new Date();
    const startDate = dateRange?.startDate
      ? new Date(dateRange.startDate)
      : new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Get tenant for currency
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    const currency = (tenantDoc.data()?.currency || 'USD') as CurrencyCode;

    // Fetch customers and bookings
    const [customersSnapshot, bookingsSnapshot] = await Promise.all([
      adminDb.collection(`tenants/${tenantId}/customers`).get(),
      adminDb
        .collection(`tenants/${tenantId}/bookings`)
        .where('createdAt', '>=', startTimestamp)
        .where('createdAt', '<=', endTimestamp)
        .get(),
    ]);

    const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Record<string, unknown>[];
    const bookings = bookingsSnapshot.docs.map(doc => doc.data() as Booking);

    // Calculate summary stats
    const totalCustomers = customers.length;

    // New customers in the period
    const newCustomersThisPeriod = customers.filter(c => {
      const createdAt = c.createdAt as { toDate?: () => Date } | undefined;
      const dateValue = createdAt?.toDate?.();
      return dateValue && dateValue >= startDate && dateValue <= endDate;
    }).length;

    // Active customers (made a booking in the period)
    const customerIdsWithBookings = new Set(bookings.map(b => b.customerId));
    const activeCustomers = customerIdsWithBookings.size;

    // Average spend per customer
    const totalSpend = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const averageSpendPerCustomer = activeCustomers > 0
      ? Math.round((totalSpend / activeCustomers) * 100) / 100
      : 0;

    // Customers by month (cumulative)
    const customersByMonthMap = new Map<string, { newCustomers: number; totalCustomers: number }>();

    // Initialize months
    let cumulativeTotal = 0;
    const monthsList: Date[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      monthsList.push(monthDate);
      const key = formatMonthKey(monthDate);
      customersByMonthMap.set(key, { newCustomers: 0, totalCustomers: 0 });
    }

    // Count new customers by month
    customers.forEach(c => {
      const createdAtObj = c.createdAt as { toDate?: () => Date } | undefined;
      const createdAt = createdAtObj?.toDate?.();
      if (createdAt) {
        const key = formatMonthKey(createdAt);
        const existing = customersByMonthMap.get(key);
        if (existing) {
          existing.newCustomers += 1;
        }
      }
    });

    // Calculate cumulative totals
    // First, count customers before the period
    const customersBeforePeriod = customers.filter(c => {
      const createdAtObj = c.createdAt as { toDate?: () => Date } | undefined;
      const createdAt = createdAtObj?.toDate?.();
      return createdAt && createdAt < startDate;
    }).length;

    cumulativeTotal = customersBeforePeriod;

    monthsList.forEach(monthDate => {
      const key = formatMonthKey(monthDate);
      const data = customersByMonthMap.get(key);
      if (data) {
        cumulativeTotal += data.newCustomers;
        data.totalCustomers = cumulativeTotal;
      }
    });

    const customersByMonth = Array.from(customersByMonthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Customer segments by spending
    const customerSpending = new Map<string, number>();
    bookings.forEach(b => {
      const current = customerSpending.get(b.customerId) || 0;
      customerSpending.set(b.customerId, current + (b.totalAmount || 0));
    });

    const segments = {
      'No purchases': 0,
      'Low ($1-500)': 0,
      'Medium ($501-2000)': 0,
      'High ($2001-5000)': 0,
      'VIP ($5000+)': 0,
    };

    customers.forEach(c => {
      const spending = customerSpending.get(c.id as string) || 0;
      if (spending === 0) segments['No purchases']++;
      else if (spending <= 500) segments['Low ($1-500)']++;
      else if (spending <= 2000) segments['Medium ($501-2000)']++;
      else if (spending <= 5000) segments['High ($2001-5000)']++;
      else segments['VIP ($5000+)']++;
    });

    const customerSegments = Object.entries(segments).map(([segment, count]) => ({
      segment,
      count,
      percentage: totalCustomers > 0 ? Math.round((count / totalCustomers) * 1000) / 10 : 0,
    }));

    // Most active customers
    const customerStats = new Map<string, {
      name: string;
      email: string;
      bookingsCount: number;
      totalSpent: number;
      lastBookingDate?: Date;
    }>();

    bookings.forEach(b => {
      const existing = customerStats.get(b.customerId);
      const bookingDate = b.createdAt?.toDate?.();

      if (existing) {
        existing.bookingsCount += 1;
        existing.totalSpent += b.totalAmount || 0;
        if (bookingDate && (!existing.lastBookingDate || bookingDate > existing.lastBookingDate)) {
          existing.lastBookingDate = bookingDate;
        }
      } else {
        const customer = customers.find(c => c.id === b.customerId);
        customerStats.set(b.customerId, {
          name: customer ? `${(customer.firstName as string) || ''} ${(customer.lastName as string) || ''}`.trim() : 'Unknown',
          email: (customer?.email as string) || '',
          bookingsCount: 1,
          totalSpent: b.totalAmount || 0,
          lastBookingDate: bookingDate,
        });
      }
    });

    const mostActiveCustomers = Array.from(customerStats.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        newCustomersThisPeriod,
        averageSpendPerCustomer,
        currency,
        customersByMonth,
        customerSegments,
        mostActiveCustomers,
      },
    };
  } catch (error) {
    console.error('Error fetching customer activity report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch customer activity report',
    };
  }
}
