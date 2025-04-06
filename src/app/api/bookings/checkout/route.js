import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/auth";
import { checkRoomBooked } from "@/utils/roomavail";

/*
    As a user, I want to a checkout page that displays all 
    details about my itinerary (flight and/or hotel), 
    collects my credit card information, validates the 
    card details, and finalizes the booking if everything is 
    correct. Note that Validation means statically checking the 
    validity of the card number and expiry date. The card should 
    not (and cannot) be charged for real.
*/

async function checkout(request) {
  let { cardNumber, expiryMonth, expiryYear, cvv, booking, passportNumber } =
    await request.json();
  let user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  user = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (
    !cardNumber ||
    !expiryMonth ||
    !expiryYear ||
    !cvv ||
    !booking ||
    !booking.itinerary ||
    (booking.flights && booking.flights.length > 0 && !passportNumber)
  ) {
    return NextResponse.json(
      { error: "Please fill in all required component." },
      { status: 400 },
    );
  }

  if (
    isNaN(parseInt(cardNumber)) ||
    isNaN(parseInt(expiryMonth)) ||
    isNaN(parseInt(expiryYear)) ||
    isNaN(parseInt(cvv))
  ) {
    return NextResponse.json(
      { error: "Invalid card format." },
      { status: 400 },
    );
  }

  if (
    cardNumber.length !== 16 ||
    expiryMonth.length !== 2 ||
    expiryYear.length !== 2 ||
    cvv.length !== 3
  ) {
    return NextResponse.json(
      { error: "Invalid card information." },
      { status: 400 },
    );
  }

  if (parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
    return NextResponse.json(
      { error: "Invalid expiry month. It must be between 01 and 12." },
      { status: 400 },
    );
  }

  const currentYear = new Date().getFullYear() % 100; // Get last two digits of the current year
  if (parseInt(expiryYear) < currentYear) {
    return NextResponse.json(
      { error: "Card expiry year cannot be in the past." },
      { status: 400 },
    );
  } else if (
    parseInt(expiryYear) === currentYear &&
    parseInt(expiryMonth) < new Date().getMonth() + 1
  ) {
    return NextResponse.json(
      { error: "Card expiry month cannot be in the past." },
      { status: 400 },
    );
  }

  booking = await prisma.booking.findUnique({
    where: {
      id: booking.id,
      userId: user.id,
    },
    include: {
      room: true,
      flights: true,
    },
  });

  if (!booking || booking.status !== "PENDING") {
    return NextResponse.json(
      { error: "Pending booking not found." },
      { status: 404 },
    );
  }

  try {
    let updatedBooking = null;
    let valid = false;
    let hotelcost = 0;
    let flightcost = 0;
    let currency = "CAD";

    if (booking.itinerary.includes("HOTEL")) {
      if (
        await checkRoomBooked(booking.room, booking.checkIn, booking.checkOut)
      ) {
        return NextResponse.json(
          { error: "Room is already booked on selected time." },
          { status: 400 },
        );
      }
      hotelcost = booking.hotelCost || 0;
      hotelcost = hotelcost > 0 ? hotelcost : booking.room.pricePerNight;
      valid = true;
    }

    if (
      booking.itinerary.includes("FLIGHT") ||
      booking.itinerary.includes("AND")
    ) {
      if (typeof passportNumber !== "string" || passportNumber.length < 9) {
        return NextResponse.json(
          { error: "Passport number must be at least 9 characters." },
          { status: 400 },
        );
      }

      if (!booking.flights || booking.flights.length === 0) {
        return NextResponse.json(
          { error: "Flight not found" },
          { status: 404 },
        );
      }

      let response = await fetch(
        "https://advanced-flights-system.replit.app/api/bookings",
        {
          method: "POST",
          headers: {
            "x-api-key": process.env.AFS_API_KEY,
            accept: "application/json",
          },
          body: JSON.stringify({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            passportNumber: passportNumber,
            flightIds: booking.flights.map((flight) => flight.flightId),
          }),
        },
      );

      if (response.ok) {
        response = await response.json();
      } else {
        return NextResponse.json(
          { error: response?.error || "Error booking flight." },
          { status: 400 },
        );
      }

      updatedBooking = await prisma.booking.update({
        where: { userId: user.id, id: booking.id },
        data: {
          bookRef: response.bookingReference,
          ticketNum: response.ticketNumber,
        },
      });
      flightcost += response.flights.reduce(
        (sum, flight) => sum + flight.price,
        0,
      );
      currency = response.flights.map((flight) => flight.currency).join(", ");
      valid = true;
    }

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid itinerary." },
        { status: 400 },
      );
    }

    updatedBooking = await prisma.booking.update({
      where: { userId: user.id, id: booking.id },
      data: {
        status: "CONFIRMED",
        invoice: {
          create: {
            userId: user.id,
            hotelCost: hotelcost || 0,
            flightCost: flightcost || 0,
            currency: currency,
            status: "PAID",
          },
        },
      },
    });

    if (booking.itinerary.includes("FLIGHT")) {
      var message = `To user ${user.firstName}: Your Flight Ticket has been booked, BookingId: ${booking.id}.`;
    } else if (booking.itinerary.includes("HOTEL")) {
      const hotel = await prisma.hotel.findFirst({
        where: { id: booking.room.hotelId },
      });

      var message = `To owner: The ${booking.room.type} Room in your ${hotel.name} Hotel has been booked from ${booking.checkIn} to ${booking.checkOut}, income: ${booking.hotelCost}.`;
      await prisma.Notification.create({
        data: {
          userId: hotel.ownerId,
          message: message,
        },
      });

      var message = `To user ${user.firstName}: ${booking.room.type} Room in ${hotel.name} Hotel has been booked from ${booking.checkIn} to ${booking.checkOut}, total cost: ${booking.hotelCost}.`;
    }
    await prisma.Notification.create({
      data: {
        userId: user.id,
        message: message,
      },
    });

    return NextResponse.json(updatedBooking, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unexpected error." },
      { status: 500 },
    );
  }
}

// Details about itinerary
async function getBookedInfo(request) {
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findFirst({
    where: { userId: user.id, status: "PENDING" },
    include: {
      room: {
        include: {
          hotel: true, // Fetch hotel details along with room
        },
      },
      flights: true, // Fetch flight details
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(booking, { status: 200 });
}

export const POST = withAuth(checkout);
export const GET = withAuth(getBookedInfo);
