import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/auth";

/*
    As a user, I want to view my bookings, so that I can 
    easily access my itinerary and booking information.
*/

async function getBookedInfo(request) {
  const url = new URL(request.url);
  let id = url.pathname.split("/").pop();
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(parseInt(id))) {
    return NextResponse.json(
      { error: "Invalid authorId parameter. It must be a number." },
      { status: 400 },
    );
  }

  id = parseInt(id);

  const booking = await prisma.booking.findUnique({
    where: {
      id: id,
      userId: user.id,
    },
    include: {
      room: {
        include: {
          hotel: true, // Include hotel info
        },
      },
      flights: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(booking, { status: 200 });
}

/*
    As a user, I want to cancel all or specific parts of 
    a booking, giving me flexibility in managing my trips.
*/

async function cancelBooking(request) {
  const url = new URL(request.url);
  let id = url.pathname.split("/").pop();
  // cancelType: "ALL" | "PARTIAL"
  // cancelFlight: json string of flightIds to cancel ! changed to boolean cause of AFS system cancel all flights
  // cancelHotel: true or false
  // case for cancelFlight deleted for simplicity and marking
  const { cancelType, cancelFlight, cancelHotel } = await request.json();
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid booking." }, { status: 400 });
  }
  id = parseInt(id);

  if (!cancelType || (cancelType !== "ALL" && cancelType !== "PARTIAL")) {
    return NextResponse.json(
      { error: "Invalid cancel type." },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: {
      id: id,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Booking is not confirmed or cancelled already." },
      { status: 400 },
    );
  }

  if (!cancelHotel && !cancelFlight) {
    return NextResponse.json(
      {
        error: "At least one of cancelHotel or cancelFlight must be provided.",
      },
      { status: 400 },
    );
  }

  try {
    let updatedBooking = null;

    const invoice = await prisma.invoice.findUnique({
      where: {
        bookingId: booking.id,
      },
    });

    if (cancelType === "ALL") {
      updatedBooking = await prisma.booking.update({
        where: {
          id: booking.id,
        },
        include: {
          user: true,
          flights: true,
        },
        data: {
          status: "CANCELED",
        },
      });
      await prisma.invoice.update({
        where: {
          bookingId: updatedBooking.id,
        },
        data: {
          refundAmount: invoice.hotelCost + invoice.flightCost,
          status: "REFUNDED",
        },
      });

      updatedBooking.flights.forEach(async (flight) => {
        await prisma.flight.delete({
          where: {
            id: flight.id,
          },
        });
      });

      await fetch(
        "https://advanced-flights-system.replit.app/api/bookings/cancel",
        {
          method: "POST",
          headers: {
            "x-api-key": process.env.AFS_API_KEY,
            accept: "application/json",
          },
          body: JSON.stringify({
            bookingReference: updatedBooking.bookRef,
            lastName: updatedBooking.user.lastName,
          }),
        },
      );

      // notify the user
      const user = await prisma.user.findUnique({
        where: { id: booking.userId },
      });
      var message = `To user ${user.firstName}: Your booking(flight and hotel) with id ${booking.id} has been cancelled successfully.`;
      await prisma.Notification.create({
        data: {
          userId: booking.userId,
          message: message,
        },
      });
    } else if (cancelType === "PARTIAL") {
      if (cancelHotel) {
        updatedBooking = await prisma.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            itinerary:
              booking.itinerary === "ROUNDTRIP_AND_HOTEL"
                ? "FLIGHT_ROUNDTRIP"
                : booking.itinerary === "ONEWAY_AND_HOTEL"
                  ? "FLIGHT_ONEWAY"
                  : "HOTEL_RESERVATION",
            hotelCost: 0,
            checkIn: null,
            checkOut: null,
            roomId: null,
          },
        });
        const invoiceToUpdate = await prisma.invoice.findFirst({
          where: { bookingId: updatedBooking.id },
        });

        if (invoiceToUpdate) {
          await prisma.invoice.update({
            where: { id: invoiceToUpdate.id },
            data: {
              refundAmount:
                (invoiceToUpdate.refundAmount ?? 0) +
                (invoiceToUpdate.hotelCost ?? 0),
              status: "REFUNDED",
            },
          });
        }

        // notify the user
        const user = await prisma.user.findUnique({
          where: { id: booking.userId },
        });
        var message = `To user ${user.firstName}: Your booking(hotel) with id ${booking.id} has been cancelled successfully.`;
        await prisma.Notification.create({
          data: {
            userId: booking.userId,
            message: message,
          },
        });
      } else if (cancelFlight) {
        updatedBooking = await prisma.booking.update({
          where: {
            id: booking.id,
          },
          include: {
            user: true,
            flights: true,
          },
          data: {
            itinerary: booking.itinerary.includes("AND")
              ? "HOTEL_RESERVATION"
              : booking.itinerary,
          },
        });

        const invoiceToUpdate = await prisma.invoice.findFirst({
          where: { bookingId: updatedBooking.id },
        });

        if (invoiceToUpdate) {
          await prisma.invoice.update({
            where: { id: invoiceToUpdate.id },
            data: {
              refundAmount:
                (invoiceToUpdate.refundAmount ?? 0) +
                (invoiceToUpdate.flightCost ?? 0),
              status: "REFUNDED",
            },
          });
        }

        for (const flight of updatedBooking.flights) {
          await prisma.flight.delete({
            where: {
              flightId: flight.flightId,
            },
          });
        }

        let response = await fetch(
          "https://advanced-flights-system.replit.app/api/bookings/cancel",
          {
            method: "POST",
            headers: {
              "x-api-key": process.env.AFS_API_KEY,
              accept: "application/json",
            },
            body: JSON.stringify({
              bookingReference: updatedBooking.bookRef,
              lastName: updatedBooking.user.lastName,
            }),
          },
        );

        if (response.ok) {
          response = await response.json();
        } else {
          return NextResponse.json(
            { error: response?.error || "Error cancelling flight." },
            { status: 400 },
          );
        }

        // notify the user
        const user = await prisma.user.findUnique({
          where: { id: booking.userId },
        });
        var message = `To user ${user.firstName}: Your booking(flight) with id ${booking.id} has been cancelled successfully.`;
        await prisma.Notification.create({
          data: {
            userId: booking.userId,
            message: message,
          },
        });
      }
    }

    return NextResponse.json(updatedBooking, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unexpected error." },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getBookedInfo);
export const PATCH = withAuth(cancelBooking);
