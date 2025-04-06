import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/auth";

/*
    As a user, I want to see hotel suggestions for the city if 
    I am flying to. I also want to see flight suggestions if I
    am about to book a hotel stay. Both suggestions must have 
    a link to take me to the main hotel/flight search page with 
    pre-filled inputs, while preserving my current, in progress order.
*/

// Get hotel/flights suggestions based on the booking type
async function getSuggestions(request) {
  const { searchParams } = new URL(request.url);
  const itinerary = searchParams.get("itinerary");
  const flightDestination = searchParams.get("flightDestination");
  const userChoiceLocation = searchParams.get("origin");
  const location = searchParams.get("destination");
  const userChoiceDate = searchParams.get("date");
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!itinerary || (!flightDestination && !location)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  switch (itinerary) {
    case "FLIGHT_ONEWAY":
    case "FLIGHT_ROUNDTRIP":
      if (!flightDestination)
        return NextResponse.json(
          { error: "Flight not found" },
          { status: 404 },
        );
      const hotels = await prisma.hotel.findMany({
        where: { city: flightDestination },
        orderBy: [{ starRating: "desc" }],
      });
      return NextResponse.json(
        {
          hotels,
          checkIn: userChoiceDate ? new Date(userChoiceDate) : new Date(),
        },
        { status: 200 },
      );

    case "HOTEL_RESERVATION":
      if (!userChoiceLocation || !location || !userChoiceDate) {
        return NextResponse.json(
          { error: "Missing required parameters for hotel reservation." },
          { status: 400 },
        );
      }

      try {
        const response = await fetch(
          `https://advanced-flights-system.replit.app/api/flights?origin=${encodeURIComponent(userChoiceLocation)}&destination=${encodeURIComponent(location)}&date=${encodeURIComponent(userChoiceDate)}`,
          {
            method: "GET",
            headers: {
              "x-api-key": process.env.AFS_API_KEY,
              accept: "application/json",
            },
          },
        );
        const message = await response.json();
        if (message.error) {
          return NextResponse.json({ error: message }, { status: 400 });
        }
        return NextResponse.json({ message }, { status: 200 });
      } catch (error) {
        void error;
        return NextResponse.json(
          { error: "Failed to fetch flight suggestions" },
          { status: 500 },
        );
      }
    case "ONEWAY_AND_HOTEL":
    case "ROUNDTRIP_AND_HOTEL":
      return NextResponse.json(
        { message: "No suggestions available for this itinerary type" },
        { status: 200 },
      );
    default:
      return NextResponse.json(
        { error: "Invalid itinerary type" },
        { status: 400 },
      );
  }
}

export const GET = withAuth(getSuggestions);

