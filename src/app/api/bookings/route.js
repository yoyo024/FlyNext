import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/auth";
import { checkRoomBooked } from "@/utils/roomavail";

/*
    As a user, I want to book an itinerary that includes a flight 
    (one-way or round-trip) and/or a hotel reservation.
*/

/*
    Create booking
    itinerary: string of itinerary type
    flights: list of flight objects
    hotelRoom: hotel room object with roomId, checkIn, checkOut
*/
async function createBooking(request) {
  const { itinerary, flights = [], hotelRoom = {} } = await request.json();

  // Verify user is logged in
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let hotelLength = Object.keys(hotelRoom).length;

  if (!itinerary || (flights.length === 0 && hotelLength === 0)) {
    return NextResponse.json(
      { error: "Itinerary is required" },
      { status: 400 },
    );
  }

  const existingBooking = await prisma.booking.findFirst({
    where: {
      userId: user.id,
      status: "PENDING",
    },
  });

  // For the case of booking already made by the user but still pending
  if (existingBooking) {
    return NextResponse.json(
      {
        message: `Booking already exists with id ${existingBooking.id}, please complete your booking before starting new one.`,
      },
      { status: 200 },
    );
  }

  // Validate required inputs
  if (
    (flights.length === 0 &&
      (itinerary.includes("FLIGHT") || itinerary.includes("AND"))) ||
    (hotelLength === 0 && itinerary.includes("HOTEL"))
  ) {
    return NextResponse.json(
      { error: "Required data missing" },
      { status: 400 },
    );
  }

  if (
    hotelLength > 0 &&
    (!hotelRoom.id ||
      !hotelRoom.checkIn ||
      !hotelRoom.checkOut ||
      !hotelRoom.price)
  ) {
    return NextResponse.json(
      { error: "Missing hotel room data" },
      { status: 400 },
    );
  }

  hotelRoom.checkIn = new Date(hotelRoom.checkIn);
  hotelRoom.checkOut = new Date(hotelRoom.checkOut);

  if (
    hotelLength > 0 &&
    (isNaN(hotelRoom.price) ||
      isNaN(hotelRoom.checkIn.getTime()) ||
      isNaN(hotelRoom.checkOut.getTime()) ||
      isNaN(hotelRoom.id))
  ) {
    return NextResponse.json(
      { error: "Invalid hotel room data type." },
      { status: 400 },
    );
  }

  if (
    hotelLength > 0 &&
    (hotelRoom.price < 0 ||
      hotelRoom.checkIn < new Date() ||
      hotelRoom.checkOut < hotelRoom.checkIn)
  ) {
    return NextResponse.json(
      { error: "Invalid hotel room data" },
      { status: 400 },
    );
  }

  // Check if hotel room is already booked
  if (
    hotelLength > 0 &&
    (await checkRoomBooked(
      hotelRoom,
      (hotelRoom.checkIn = new Date(hotelRoom.checkIn)),
      (hotelRoom.checkOut = new Date(hotelRoom.checkOut)),
    ))
  ) {
    return NextResponse.json(
      { error: "Room is not available on selected time." },
      { status: 400 },
    );
  }

  for (const flight of flights) {
    // Validate flight format
    if (!flight.id || typeof flight.id !== "string") {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 });
    }

    if (!flight.flightNumber || typeof flight.flightNumber !== "string") {
      return NextResponse.json(
        { error: "Invalid flight number" },
        { status: 400 },
      );
    }

    if (
      !flight.departureTime ||
      isNaN(new Date(flight.departureTime).getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid departure time" },
        { status: 400 },
      );
    }

    if (!flight.arrivalTime || isNaN(new Date(flight.arrivalTime).getTime())) {
      return NextResponse.json(
        { error: "Invalid arrival time" },
        { status: 400 },
      );
    }

    if (!flight.price || typeof flight.price !== "number" || flight.price < 0) {
      return NextResponse.json(
        { error: "Invalid flight price" },
        { status: 400 },
      );
    }

    if (
      !flight.origin ||
      !flight.origin.code ||
      !flight.origin.name ||
      !flight.origin.city ||
      !flight.origin.country
    ) {
      return NextResponse.json(
        { error: "Invalid flight origin information" },
        { status: 400 },
      );
    }

    if (
      !flight.destination ||
      !flight.destination.code ||
      !flight.destination.name ||
      !flight.destination.city ||
      !flight.destination.country
    ) {
      return NextResponse.json(
        { error: "Invalid flight destination information" },
        { status: 400 },
      );
    }

    if (!flight.airline || !flight.airline.code || !flight.airline.name) {
      return NextResponse.json(
        { error: "Invalid airline information" },
        { status: 400 },
      );
    }
  }

  try {
    let newBooking = await prisma.booking.create({
      data: {
        userId: user.id,
        itinerary: itinerary,
        hotelCost:
          hotelLength > 3
            ? hotelRoom.price *
              ((new Date(hotelRoom.checkOut) - new Date(hotelRoom.checkIn)) /
                (1000 * 60 * 60 * 24))
            : null,
        checkIn: hotelLength > 3 ? new Date(hotelRoom.checkIn) : null,
        checkOut: hotelLength > 3 ? new Date(hotelRoom.checkOut) : null,
        roomId: hotelLength > 3 ? hotelRoom.id : null,
        reserveTime: hotelLength > 3 ? new Date() : null,
        status: "PENDING",
      },
    });

    if (flights.length > 0) {
      for (const flight of flights) {
        // Check if the flight already exists
        const existingFlight = await prisma.flight.findUnique({
          where: {
            flightId: flight.id,
          },
        });

        let flightRecord;
        if (!existingFlight) {
          // If the flight doesn't exist, create a new one
          flightRecord = await prisma.flight.create({
            data: {
              flightId: flight.id,
              flightNum: flight.flightNumber,
              departureTime: new Date(flight.departureTime),
              arrivalTime: new Date(flight.arrivalTime),
              flightCost: flight.price > 0 ? flight.price : null,
              origin: `${flight.origin.code}, ${flight.origin.name}, ${flight.origin.city}, ${flight.origin.country}`,
              destination: `${flight.destination.code}, ${flight.destination.name}, ${flight.destination.city}, ${flight.destination.country}`,
              airline: `${flight.airline.code}, ${flight.airline.name}`,
            },
          });
        } else {
          // If the flight exists, use the existing record
          flightRecord = existingFlight;
        }

        // Link the flight to the booking
        newBooking = await prisma.booking.update({
          where: {
            id: newBooking.id,
          },
          data: {
            flights: {
              connect: { flightId: flightRecord.flightId },
            },
          },
          include: {
            room: true,
            flights: true,
          },
        });
      }
    }
    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    void error;
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}

/* 
    As a user, I want to book an itinerary that includes a flight 
    (one-way or round-trip) and/or a hotel reservation.
*/

// Get pending booking details
async function getBookedInfo(request) {
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
        flights: true,
      },
    });

    if (!booking) {
      return NextResponse.json({}, { status: 200 });
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/*
    As a user, I want to book an itinerary that includes a flight 
    (one-way or round-trip) and/or a hotel reservation.

    As a user, I want to see hotel suggestions for the city if I 
    am flying to. I also want to see flight suggestions if I am 
    about to book a hotel stay. Both suggestions must have a link 
    to take me to the main hotel/flight search page with pre-filled 
    inputs, while preserving my current, in progress order.

*/

// Allows user to add flight/hotel to in progress booking
async function updateBooking(request) {
  /*  
        id is the booking id
        addFlight is a list of flights to add
        addHotel is the hotel to add with json string (id, checkIn, checkOut) or {}
    */
  const { id, price = 0, addFlight = [], addHotel = {}, room = {} } = await request.json();
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: {
      id: id,
    },
    include: {
      user: true,
      flights: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (addFlight.length === 0 && !Object.keys(addHotel).length) {
    return NextResponse.json({ error: "No data to update" }, { status: 400 });
  }

  if (booking.status === "CONFIRMED") {
    return NextResponse.json(
      { error: "Booking is already confirmed" },
      { status: 400 },
    );
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Booking is already cancelled" },
      { status: 400 },
    );
  }

  for (const flight of addFlight) {
    // Validate flight format
    if (!flight.id || typeof flight.id !== "string") {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 });
    }

    if (!flight.flightNumber || typeof flight.flightNumber !== "string") {
      return NextResponse.json(
        { error: "Invalid flight number" },
        { status: 400 },
      );
    }

    if (
      !flight.departureTime ||
      isNaN(new Date(flight.departureTime).getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid departure time" },
        { status: 400 },
      );
    }

    if (!flight.arrivalTime || isNaN(new Date(flight.arrivalTime).getTime())) {
      return NextResponse.json(
        { error: "Invalid arrival time" },
        { status: 400 },
      );
    }

    if (!flight.price || typeof flight.price !== "number" || flight.price < 0) {
      return NextResponse.json(
        { error: "Invalid flight price" },
        { status: 400 },
      );
    }

    if (
      !flight.origin ||
      !flight.origin.code ||
      !flight.origin.name ||
      !flight.origin.city ||
      !flight.origin.country
    ) {
      return NextResponse.json(
        { error: "Invalid flight origin information" },
        { status: 400 },
      );
    }

    if (
      !flight.destination ||
      !flight.destination.code ||
      !flight.destination.name ||
      !flight.destination.city ||
      !flight.destination.country
    ) {
      return NextResponse.json(
        { error: "Invalid flight destination information" },
        { status: 400 },
      );
    }

    if (!flight.airline || !flight.airline.code || !flight.airline.name) {
      return NextResponse.json(
        { error: "Invalid airline information" },
        { status: 400 },
      );
    }
  }

  if (booking.status === "PENDING") {
    let updatedBooking = booking;

    if (addFlight.length > 0) {
      let itinerary;

      if (booking.itinerary.includes("HOTEL")) {
        if (
          addFlight.length === 2 &&
          addFlight[0].origin.city === addFlight[1].destination.city
        ) {
          itinerary = "ROUNDTRIP_AND_HOTEL";
        } else {
          itinerary = "ONEWAY_AND_HOTEL";
        }
      } else {
        if (
          addFlight.length === 2 &&
          addFlight[0].origin.city === addFlight[1].destination.city
        ) {
          itinerary = "FLIGHT_ROUNDWAY";
        } else {
          itinerary = "FLIGHT_ONEWAY";
        }
      }

      for (const flight of addFlight) {
        const existingFlight = await prisma.flight.findUnique({
          where: { flightId: flight.id },
        });

        let flightRecord =
          existingFlight ||
          (await prisma.flight.create({
            data: {
              flightId: flight.id,
              flightNum: flight.flightNumber,
              departureTime: new Date(flight.departureTime),
              arrivalTime: new Date(flight.arrivalTime),
              flightCost: flight.price > 0 ? flight.price : null,
              origin: `${flight.origin.code}, ${flight.origin.name}, ${flight.origin.city}, ${flight.origin.country}`,
              destination: `${flight.destination.code}, ${flight.destination.name}, ${flight.destination.city}, ${flight.destination.country}`,
              airline: `${flight.airline.code}, ${flight.airline.name}`,
            },
          }));

        // Link the flight to the booking
        updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            itinerary: itinerary,
            flights: {
              connect: { flightId: flightRecord.flightId },
            },
          },
          include: {
            room: {
              include: {
                hotel: true,
              },
            },
            flights: true,
          },
        });
      }
    }

    if (addHotel && Object.keys(addHotel).length > 0) {
      // Check for missing or invalid hotel fields
      if (
        !addHotel.id ||
        !addHotel.checkIn ||
        !addHotel.checkOut ||
        !addHotel.price
      ) {
        return NextResponse.json(
          { error: "Missing or invalid hotel data" },
          { status: 400 },
        );
      }

      // Check if room is available
      addHotel.checkIn = new Date(addHotel.checkIn);
      addHotel.checkOut = new Date(addHotel.checkOut);

      if (
        addHotel.checkIn >= addHotel.checkOut ||
        addHotel.checkIn < new Date()
      ) {
        return NextResponse.json(
          { error: "Invalid hotel check-in and check-out dates." },
          { status: 400 },
        );
      }

      const isRoomBooked = await checkRoomBooked(
        addHotel,
        addHotel.checkIn,
        addHotel.checkOut,
      );
      if (isRoomBooked) {
        return NextResponse.json(
          { error: "Room is already booked." },
          { status: 400 },
        );
      }

      // Prepare updated hotel information
      const nights =
        (addHotel.checkOut - addHotel.checkIn) / (1000 * 60 * 60 * 24);
      const hotelCost =
        addHotel.price * nights > 0 ? addHotel.price * nights : null;

      if (!hotelCost) {
        return NextResponse.json(
          { error: "Invalid hotel cost." },
          { status: 400 },
        );
      }

      const updatedBookingData = {
        itinerary: booking.itinerary.includes("ONEWAY")
          ? "ONEWAY_AND_HOTEL"
          : booking.itinerary.includes("ROUNDTRIP")
            ? "ROUNDTRIP_AND_HOTEL"
            : "HOTEL_RESERVATION",
        roomId: addHotel.id,
        hotelCost: hotelCost,
        checkIn: addHotel.checkIn,
        checkOut: addHotel.checkOut,
        reserveTime: new Date(),
      };

      // Validate hotel data before updating
      if (
        !updatedBookingData.hotelCost ||
        !updatedBookingData.checkIn ||
        !updatedBookingData.checkOut
      ) {
        return NextResponse.json(
          { error: "Invalid hotel data." },
          { status: 400 },
        );
      }

      // Update the booking with hotel information
      updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: updatedBookingData,
        include: {
          room: {
            include: {
              hotel: true,
            },
          },
          flights: true,
        },
      });
    }

    return NextResponse.json(updatedBooking, { status: 200 });
  }

  return NextResponse.json(
    { error: "You're trying to update a non-pending booking." },
    { status: 400 },
  );
}

export const POST = withAuth(createBooking);
export const GET = withAuth(getBookedInfo);
export const PATCH = withAuth(updateBooking);
