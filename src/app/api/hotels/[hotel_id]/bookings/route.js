// As a hotel owner, I want to view and filter my hotel’s booking list by date
// and/or room type
//
// {{base_url}}/hotels/:hotel_id/bookings

import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { withAuth } from "@/utils/auth";

async function GET_booking(request, { params }) {
  if (request.method !== "GET") {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 },
    );
  }

  const { hotel_id } = await params;
  const hotel_id_int = parseInt(hotel_id);

  if (isNaN(hotel_id_int)) {
    return NextResponse.json({ message: "Invalid hotel ID" }, { status: 400 });
  }

  try {
    // Check if hotel exists
    const hotel = await prisma.Hotel.findUnique({
      where: { id: hotel_id_int },
    });

    if (!hotel) {
      return NextResponse.json({ message: "Hotel not found" }, { status: 404 });
    }

    // Check if the authenticated user owns this hotel
    if (hotel.ownerId !== request.user.id) {
      return NextResponse.json(
        { message: "Unauthorized: You do not own this hotel." },
        { status: 403 },
      );
    }

    // Retrieve query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const dateParam = searchParams.get("date");
    const roomType = searchParams.get("roomType");

    // Validate and parse the date
    let formattedDate;
    if (dateParam) {
      formattedDate = new Date(dateParam);
      if (formattedDate.toString() === "Invalid Date") {
        return NextResponse.json(
          { message: "Invalid date format" },
          { status: 400 },
        );
      }
    }

    // Fetch bookings with filtering
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const bookings = await prisma.Booking.findMany({
      where: {
        checkIn: {
          lte: formattedDate,
        },
        checkOut: {
          gte: formattedDate,
        },
        room: {
          hotelId: Number(hotel_id_int),
          ...(roomType && { type: roomType }),
        },
        OR: [
          { status: "CONFIRMED" },
          {
            status: "PENDING",
            reserveTime: { gt: yesterday },
          },
        ],
      },
      include: { room: true },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

async function PUT_booking(request, { params }) {
  if (request.method !== "PUT") {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 },
    );
  }

  // Get hotel_id from URL path
  const { hotel_id } = await params;
  const hotel_id_int = parseInt(hotel_id);

  if (isNaN(hotel_id_int)) {
    return NextResponse.json({ message: "Invalid hotel ID" }, { status: 400 });
  }

  try {
    // Check if hotel exists
    const hotel = await prisma.Hotel.findUnique({
      where: { id: hotel_id_int },
    });

    if (!hotel) {
      return NextResponse.json({ message: "Hotel not found" }, { status: 404 });
    }

    // Check if the authenticated user owns this hotel
    if (hotel.ownerId !== request.user.id) {
      return NextResponse.json(
        { message: "Unauthorized: You do not own this hotel." },
        { status: 403 },
      );
    }

    // Get bookingId from request body
    const { searchParams } = new URL(request.url);
    const bookingId_str = searchParams.get("bookingId");
    const bookingId = parseInt(bookingId_str);
    if (!bookingId) {
      return NextResponse.json(
        { message: "Booking ID is required." },
        { status: 400 },
      );
    }

    // Check if the booking exists
    const booking = await prisma.Booking.findUnique({
      where: { id: bookingId, status: "CONFIRMED" },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 },
      );
    }

    // Ensure the booking belongs to the hotel
    if (booking.room.hotelId !== hotel.id) {
      return NextResponse.json(
        { message: "Booking does not belong to your hotel." },
        { status: 403 },
      );
    }

    // Refund the user
    await prisma.invoice.update({
      where: { bookingId: booking.id },
      data: { refundAmount: booking.hotelCost, status: "REFUNDED" },
    });

    // cancel the booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELED" },
    });

    // create notification to notify the user abt the cancel
    const user = await prisma.user.findUnique({
      where: { id: booking.userId },
    });
    var message = `To user ${user.firstName}: Your booking of ${booking.room.type} Room in ${hotel.name} Hotel from ${booking.checkIn} to ${booking.checkOut} has been cancelled by the hotel owner.`;
    await prisma.Notification.create({
      data: {
        userId: booking.userId,
        message: message,
      },
    });
    return NextResponse.json({ message: "Booking cancelled successfully." });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Wrap with authentication
export const GET = withAuth(GET_booking);
export const PUT = withAuth(PUT_booking);
