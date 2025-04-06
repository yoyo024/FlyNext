import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/auth";

const baseUrl = "https://advanced-flights-system.replit.app";

// As a user, I want to verify my flight booking to ensure the flight schedule remains as planned.
async function verifyFlight(request) {
    const url = new URL(request.url);
    let id = url.pathname.split("/")[3];
    let user = request.user;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json({"error": 'Invalid booking.' }, { status: 400 });
    }

    id = parseInt(id);

    const booking = await prisma.booking.findUnique({
        where: {
            id: id,
        }
    });

    if (!booking) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (booking.status !== "CONFIRMED") {
        return NextResponse.json({ error: "Booking is cancelled already." }, { status: 400 });
    }
    
    user = await prisma.user.findUnique({  
        where: {
            id: booking.userId
        }
    });

    if (!user) {
      return NextResponse.json({ "error": "User not found"}, { status: 404 });
    }
 
    let response = await fetch(
        `${baseUrl}/api/bookings/retrieve?lastName=${user.lastName}&bookingReference=${booking.bookRef}`,
        {
            method: "GET",
            headers: {
                "x-api-key": process.env.AFS_API_KEY,
                "accept": "application/json"
            }
        }
    );

    if (response.ok) {
        response = await response.json();
    } else {
        return NextResponse.json({ error: response.error }, { status: 400 });
    }

    const bookingStatus = {
        bookStatus: response.status,
        flightId: response.flights.map(flight => flight.id),
        flightsStatus: response.flights.map(flight => flight.status)
    };
    return NextResponse.json(bookingStatus, { status: 200 });
}

export const GET = withAuth(verifyFlight);
