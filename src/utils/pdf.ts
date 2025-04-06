import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateInvoicePdf(booking: any, invoice: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  let y = height - 50;
  const lineHeight = 20;

  const currencyList: string[] = invoice.currencyList || [];
  let currencyIndex = 0;

  const drawText = (text: string, options?: { color?: any; size?: number }) => {
    page.drawText(text, {
      x: 50,
      y,
      size: options?.size || 12,
      font,
      color: options?.color || rgb(0, 0, 0),
    });
    y -= lineHeight;
  };
  
  // Header
  drawText('Booking Invoice', { size: 22 });
  y -= 10;
  drawText(`Issued on: ${new Date(invoice.createdAt).toLocaleDateString()}`);
  y -= 15;
  
  // User Info
  drawText('--- User Information ---', { size: 14 });
  drawText(`Name: ${booking.user.firstName ?? ''} ${booking.user.lastName ?? ''}`);
  drawText(`Email: ${booking.user.email ?? 'N/A'}`);
  y -= 15;
  
  // Booking Info
  drawText('--- Booking Details ---', { size: 14 });
  drawText(`Booking Status: ${booking.status}`);
  drawText(`Payment Status: ${invoice.status}`);
  y -= 15;
  
  // Cost Breakdown
  drawText('--- Cost Breakdown ---', { size: 14 });
  
  const hotelCurrency = booking.hotelCost > 0 ? currencyList[currencyIndex++] || '' : '';
  const flightCurrency = (booking.flights?.length ?? 0) > 0 && booking.flightCost > 0
    ? currencyList[currencyIndex] || ''
    : '';
  
  drawText(`Hotel Cost: ${hotelCurrency} $${(invoice.hotelCost ?? 0).toFixed(2)}`);
  drawText(`Flight Cost: ${flightCurrency} $${(invoice.flightCost ?? 0).toFixed(2)}`);
  
  const total = (invoice.hotelCost ?? 0) + (invoice.flightCost ?? 0);
  drawText(`Total: ${currencyList[0] ?? ''} $${total.toFixed(2)}`, { size: 13 });
  y -= 10;
  
  // Refund Section
  if (invoice.refundAmount && invoice.refundAmount > 0) {
    drawText(
      `Refund Issued: ${currencyList[0] ?? ''} $${invoice.refundAmount.toFixed(2)}`,
      { color: rgb(1, 0, 0), size: 12 }
    );
    y -= 10;
  }
  
  // Footer
  y -= 20;
  drawText('Thank you for booking with FlyNext.', {
    size: 10,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
  
}


