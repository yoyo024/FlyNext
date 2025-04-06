export const runtime = 'nodejs';
import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/auth";
import { generateInvoicePdf } from '@/utils/pdf';



// As a user, I want to receive an minimal, PDF invoice for my trip booking, so that I have a record of the booking and transaction.

async function getInvoice(request) {
    const url = new URL(request.url);
    let id = url.pathname.split("/")[3];
    let user = request.user;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json({"error": 'Booking id should be a number.' }, { status: 400 });
    }

    id = parseInt(id);
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) }, include: { flights: true, room: { include: { hotel: true}}, user: true} });
  
    if (!booking) {
      return NextResponse.json({ "error": `Booking with ID ${id} not found.` }, { status: 404 });
    }

    if (booking.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (booking.status === "PENDING") {
        return NextResponse.json({ error: "Booking is still pending, no invoice." }, { status: 400 });
    }

    const invoiceInfo = await prisma.invoice.findUnique({ where: { bookingId: booking.id } });

    const pdfBuffer = await generateInvoicePdf(booking, invoiceInfo, user);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${booking.itinerary}.pdf"`,
      },
    });
}

export const GET = withAuth(getInvoice);