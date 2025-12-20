'use server';

// Booking server actions
// T098-T102 [US2] Booking actions

import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { ActionResult } from '@/lib/actions/types';
import { createAuditLog } from '@/lib/audit/create-log';
import {
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  updateTravelerPassportSchema,
  CreateBookingInput,
  UpdateBookingInput,
  UpdateBookingStatusInput,
  UpdateTravelerPassportInput,
} from '@/lib/validations/bookings';
import { Booking, BookingStatus, PackageSnapshot } from '@/types/models/booking';
import { Package } from '@/types/models/package';
import {
  triggerBookingConfirmedNotification,
  triggerBookingCancelledNotification,
} from '@/lib/notifications/triggers';

/**
 * Generate booking number (e.g., "BK-2024-0001")
 */
async function generateBookingNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BK-${year}-`;

  // Get the latest booking number for this year
  const bookings = await adminDb
    .collection(`tenants/${tenantId}/bookings`)
    .where('bookingNumber', '>=', prefix)
    .where('bookingNumber', '<', `BK-${year + 1}-`)
    .orderBy('bookingNumber', 'desc')
    .limit(1)
    .get();

  if (bookings.empty) {
    return `${prefix}0001`;
  }

  const lastNumber = bookings.docs[0].data().bookingNumber;
  const lastSequence = parseInt(lastNumber.split('-')[2], 10);
  const newSequence = (lastSequence + 1).toString().padStart(4, '0');

  return `${prefix}${newSequence}`;
}

/**
 * Create package snapshot for booking
 */
async function createPackageSnapshot(
  tenantId: string,
  packageId: string
): Promise<PackageSnapshot | null> {
  const packageDoc = await adminDb
    .doc(`tenants/${tenantId}/packages/${packageId}`)
    .get();

  if (!packageDoc.exists) {
    return null;
  }

  const pkg = packageDoc.data() as Package;

  // Get services for this package
  const servicesSnapshot = await adminDb
    .collection(`tenants/${tenantId}/packages/${packageId}/services`)
    .orderBy('displayOrder')
    .get();

  const services = servicesSnapshot.docs.map((doc) => {
    const service = doc.data();
    return {
      id: doc.id,
      name: service.name,
      category: service.category,
      price: service.price,
      isOutsourced: service.isOutsourced || false,
      partnerOfficeId: service.partnerOfficeId,
      partnerOfficeName: service.partnerOfficeName,
      commissionPercentage: service.commissionPercentage,
    };
  });

  return {
    name: pkg.name,
    type: pkg.type,
    services,
    totalPrice: pkg.totalPrice,
  };
}

/**
 * T098 [US2] Create a new booking
 */
export async function createBookingAction(
  tenantId: string,
  userId: string,
  input: CreateBookingInput
): Promise<ActionResult<Booking>> {
  try {
    // Validate input
    const validatedData = createBookingSchema.parse(input);

    // Check if customer exists
    const customerDoc = await adminDb
      .doc(`tenants/${tenantId}/customers/${validatedData.customerId}`)
      .get();

    if (!customerDoc.exists) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    // Check if package exists and is active
    const packageDoc = await adminDb
      .doc(`tenants/${tenantId}/packages/${validatedData.packageId}`)
      .get();

    if (!packageDoc.exists) {
      return {
        success: false,
        error: 'Package not found',
      };
    }

    const pkg = packageDoc.data() as Package;

    if (pkg.status !== 'active') {
      return {
        success: false,
        error: 'Package is not available for booking',
      };
    }

    // Check package capacity
    if (pkg.maxCapacity && pkg.currentBookings >= pkg.maxCapacity) {
      return {
        success: false,
        error: 'Package has reached maximum capacity',
      };
    }

    // Create package snapshot
    const packageSnapshot = await createPackageSnapshot(tenantId, validatedData.packageId);

    if (!packageSnapshot) {
      return {
        success: false,
        error: 'Failed to create package snapshot',
      };
    }

    // Generate booking number
    const bookingNumber = await generateBookingNumber(tenantId);

    // Create booking document
    const bookingRef = adminDb.collection(`tenants/${tenantId}/bookings`).doc();
    const now = Timestamp.now();

    // Calculate total amount based on number of travelers
    const totalAmount = packageSnapshot.totalPrice * validatedData.travelers.length;

    // Create required documents list based on package
    const requiredDocuments = pkg.requiredDocuments?.map((docType) => ({
      type: docType,
      status: 'pending' as const,
    })) || [];

    const booking: Booking = {
      id: bookingRef.id,
      bookingNumber,
      customerId: validatedData.customerId,
      packageId: validatedData.packageId,
      packageSnapshot,
      travelers: validatedData.travelers,
      status: 'pending',
      paymentStatus: 'unpaid',
      bookingDate: now,
      travelDate: Timestamp.fromDate(new Date(validatedData.travelDate)),
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      currency: pkg.currency,
      requiredDocuments,
      notes: validatedData.notes,
      source: validatedData.source,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    // Use batch to update booking and package atomically
    const batch = adminDb.batch();
    batch.set(bookingRef, booking);
    batch.update(adminDb.doc(`tenants/${tenantId}/packages/${validatedData.packageId}`), {
      currentBookings: (pkg.currentBookings || 0) + 1,
      updatedAt: now,
    });
    await batch.commit();

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'create',
      resource: 'booking',
      resourceId: booking.id,
      description: `Created booking ${bookingNumber} for package: ${packageSnapshot.name}`,
    });

    revalidatePath(`/[locale]/(dashboard)/bookings`);
    revalidatePath(`/[locale]/(dashboard)/packages/${validatedData.packageId}`);

    return {
      success: true,
      data: booking,
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create booking',
    };
  }
}

/**
 * T099 [US2] Update an existing booking
 */
export async function updateBookingAction(
  tenantId: string,
  userId: string,
  bookingId: string,
  input: UpdateBookingInput
): Promise<ActionResult<Booking>> {
  try {
    // Validate input
    const validatedData = updateBookingSchema.parse(input);

    const bookingRef = adminDb.doc(`tenants/${tenantId}/bookings/${bookingId}`);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    const existingBooking = bookingDoc.data() as Booking;

    // Prevent updates to completed or cancelled bookings
    if (['completed', 'cancelled'].includes(existingBooking.status)) {
      return {
        success: false,
        error: 'Cannot update a completed or cancelled booking',
      };
    }

    const updatedBooking = {
      ...existingBooking,
      ...validatedData,
      travelDate: validatedData.travelDate
        ? Timestamp.fromDate(new Date(validatedData.travelDate))
        : existingBooking.travelDate,
      updatedAt: Timestamp.now(),
    };

    // Recalculate total if travelers changed
    if (validatedData.travelers) {
      updatedBooking.totalAmount =
        existingBooking.packageSnapshot.totalPrice * validatedData.travelers.length;
      updatedBooking.balance = updatedBooking.totalAmount - existingBooking.paidAmount;
    }

    await bookingRef.update(updatedBooking);

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'update',
      resource: 'booking',
      resourceId: bookingId,
      description: `Updated booking ${existingBooking.bookingNumber}`,
    });

    revalidatePath(`/[locale]/(dashboard)/bookings`);
    revalidatePath(`/[locale]/(dashboard)/bookings/${bookingId}`);

    return {
      success: true,
      data: updatedBooking as Booking,
    };
  } catch (error) {
    console.error('Error updating booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update booking',
    };
  }
}

/**
 * T100 [US2] Update booking status
 */
export async function updateBookingStatusAction(
  tenantId: string,
  userId: string,
  bookingId: string,
  input: UpdateBookingStatusInput
): Promise<ActionResult<Booking>> {
  try {
    // Validate input
    const validatedData = updateBookingStatusSchema.parse(input);

    const bookingRef = adminDb.doc(`tenants/${tenantId}/bookings/${bookingId}`);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    const existingBooking = bookingDoc.data() as Booking;

    // Validate status transition
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['completed'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[existingBooking.status].includes(validatedData.status)) {
      return {
        success: false,
        error: `Cannot transition from ${existingBooking.status} to ${validatedData.status}`,
      };
    }

    const now = Timestamp.now();
    const updateData: Partial<Booking> = {
      status: validatedData.status,
      updatedAt: now,
    };

    await bookingRef.update(updateData);

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'status_change',
      resource: 'booking',
      resourceId: bookingId,
      description: `Changed booking ${existingBooking.bookingNumber} status from ${existingBooking.status} to ${validatedData.status}`,
      changes: [
        {
          field: 'status',
          oldValue: existingBooking.status,
          newValue: validatedData.status,
        },
      ],
    });

    // Trigger notification based on status change
    try {
      if (validatedData.status === 'confirmed') {
        await triggerBookingConfirmedNotification(tenantId, existingBooking.customerId, {
          bookingNumber: existingBooking.bookingNumber,
          packageName: existingBooking.packageSnapshot.name,
          totalAmount: existingBooking.totalAmount,
          currency: existingBooking.currency,
          bookingId,
        });
      } else if (validatedData.status === 'cancelled') {
        await triggerBookingCancelledNotification(tenantId, existingBooking.customerId, {
          bookingNumber: existingBooking.bookingNumber,
          packageName: existingBooking.packageSnapshot.name,
          bookingId,
          reason: validatedData.reason,
        });
      }
    } catch (notificationError) {
      console.error('Failed to send booking notification:', notificationError);
    }

    revalidatePath(`/[locale]/(dashboard)/bookings`);
    revalidatePath(`/[locale]/(dashboard)/bookings/${bookingId}`);

    return {
      success: true,
      data: { ...existingBooking, ...updateData } as Booking,
    };
  } catch (error) {
    console.error('Error updating booking status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update booking status',
    };
  }
}

/**
 * T101 [US2] Upload booking document
 */
export async function uploadBookingDocumentAction(
  tenantId: string,
  userId: string,
  bookingId: string,
  documentType: 'passport' | 'visa' | 'photo' | 'vaccination' | 'other',
  documentUrl: string
): Promise<ActionResult<Booking>> {
  try {
    const bookingRef = adminDb.doc(`tenants/${tenantId}/bookings/${bookingId}`);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    const existingBooking = bookingDoc.data() as Booking;
    const now = Timestamp.now();

    // Update required document status
    const requiredDocuments = existingBooking.requiredDocuments.map((doc) => {
      if (doc.type === documentType && doc.status === 'pending') {
        return {
          ...doc,
          status: 'uploaded' as const,
          documentId: `doc_${Date.now()}`,
        };
      }
      return doc;
    });

    await bookingRef.update({
      requiredDocuments,
      updatedAt: now,
    });

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'update',
      resource: 'booking',
      resourceId: bookingId,
      description: `Uploaded ${documentType} document for booking ${existingBooking.bookingNumber}`,
    });

    revalidatePath(`/[locale]/(dashboard)/bookings/${bookingId}`);

    return {
      success: true,
      data: { ...existingBooking, requiredDocuments, updatedAt: now } as Booking,
    };
  } catch (error) {
    console.error('Error uploading booking document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document',
    };
  }
}

/**
 * T102 [US2] Update traveler passport data
 */
export async function updateTravelerPassportAction(
  tenantId: string,
  userId: string,
  input: UpdateTravelerPassportInput
): Promise<ActionResult<Booking>> {
  try {
    // Validate input
    const validatedData = updateTravelerPassportSchema.parse(input);

    const bookingRef = adminDb.doc(`tenants/${tenantId}/bookings/${validatedData.bookingId}`);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    const existingBooking = bookingDoc.data() as Booking;

    if (validatedData.travelerIndex >= existingBooking.travelers.length) {
      return {
        success: false,
        error: 'Invalid traveler index',
      };
    }

    const now = Timestamp.now();

    // Update traveler passport
    const travelers = [...existingBooking.travelers];
    travelers[validatedData.travelerIndex] = {
      ...travelers[validatedData.travelerIndex],
      passport: {
        passportNumber: validatedData.passport.passportNumber.toUpperCase(),
        fullName: validatedData.passport.fullName,
        dateOfBirth: Timestamp.fromDate(new Date(validatedData.passport.dateOfBirth)),
        expiryDate: Timestamp.fromDate(new Date(validatedData.passport.expiryDate)),
        nationality: validatedData.passport.nationality.toUpperCase(),
        gender: validatedData.passport.gender,
        issuingCountry: validatedData.passport.issuingCountry.toUpperCase(),
        manuallyVerified: true,
        extractedAt: now,
      },
    };

    await bookingRef.update({
      travelers,
      updatedAt: now,
    });

    // Create audit log
    await createAuditLog({
      tenantId,
      userId,
      action: 'update',
      resource: 'booking',
      resourceId: validatedData.bookingId,
      description: `Updated passport for traveler ${validatedData.travelerIndex + 1} in booking ${existingBooking.bookingNumber}`,
    });

    revalidatePath(`/[locale]/(dashboard)/bookings/${validatedData.bookingId}`);

    return {
      success: true,
      data: { ...existingBooking, travelers, updatedAt: now } as Booking,
    };
  } catch (error) {
    console.error('Error updating traveler passport:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update passport',
    };
  }
}

/**
 * Get booking by ID
 */
export async function getBookingAction(
  tenantId: string,
  bookingId: string
): Promise<ActionResult<Booking>> {
  try {
    const bookingDoc = await adminDb
      .doc(`tenants/${tenantId}/bookings/${bookingId}`)
      .get();

    if (!bookingDoc.exists) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    return {
      success: true,
      data: bookingDoc.data() as Booking,
    };
  } catch (error) {
    console.error('Error getting booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get booking',
    };
  }
}

/**
 * Cancel booking
 */
export async function cancelBookingAction(
  tenantId: string,
  userId: string,
  bookingId: string,
  reason?: string
): Promise<ActionResult<Booking>> {
  return updateBookingStatusAction(tenantId, userId, bookingId, {
    status: 'cancelled',
    reason,
  });
}
