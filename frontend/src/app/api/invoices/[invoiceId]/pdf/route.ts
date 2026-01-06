// Invoice PDF API route
// T138 [US3] Create invoice PDF API route

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { adminDb } from '@/lib/firebase/admin';
import { Invoice } from '@/types/models/invoice';
import { InvoicePDF } from '@/lib/pdf/invoice-template';
import { getSessionUser } from '@/lib/auth/require-role';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;

    // Get tenant ID from session
    const user = await getSessionUser();

    if (!user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = user.tenantId;

    // Get invoice from Firestore
    const invoiceDoc = await adminDb
      .doc(`tenants/${tenantId}/invoices/${invoiceId}`)
      .get();

    if (!invoiceDoc.exists) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = invoiceDoc.data() as Invoice;

    // Get tenant info for company details
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    const tenant = tenantDoc.exists ? tenantDoc.data() : null;

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      InvoicePDF({
        invoice,
        companyName: tenant?.name || 'Travel Agency',
        companyAddress: tenant?.address || '',
        companyPhone: tenant?.phone || '',
        companyEmail: tenant?.email || '',
      })
    );

    // Return PDF as response - convert Buffer to Uint8Array for Next.js 16 compatibility
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
