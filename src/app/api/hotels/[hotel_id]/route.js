// As a visitor, I want to view detailed hotel information, including room types, 
// amenities, and pricing.
//
// {{base_url}}/hotels/:hotel_id

import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { withAuth } from "@/utils/auth";
async function handler(request, {params}) {
    if (request.method !== "GET") {
        return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
    }

    try {
        const {hotel_id} = await params;
        const hotel_id_int = parseInt(hotel_id);
        console.log(hotel_id_int);

        // Fetch the hotel(by hoetlId) with their rooms and detailed information
        const hotel = await prisma.Hotel.findUnique({
            where:{id: hotel_id_int},
            include: {
                rooms: {
                    include: {
                        bookings: false,
                    },
                },
            },
        });

        if (!hotel) {
            return NextResponse.json({ message: "No hotels found" }, { status: 404 });
        }

        return NextResponse.json(hotel);
    } catch (error) {
        console.error("Error fetching hotel data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export const GET = withAuth(handler);
