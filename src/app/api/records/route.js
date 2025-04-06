import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/auth";

/*
    As a user, I want to view my bookings, so that I can 
    easily access my itinerary and booking information.
*/

async function getBookings(request) {
    const user = request.user;
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const bookings = await prisma.booking.findMany({
        where: { userId: user.id,
                OR: [
                    { status: "CONFIRMED" },
                    { status: "CANCELED" }
                ]
        },
        include: {
            room: {
                include: {
                    hotel: true // Include hotel info
                }
            },
            flights: true
        }
    });
    return NextResponse.json(bookings, { status: 200 });
}

export const GET = withAuth(getBookings);