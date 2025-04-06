// As a visitor, I want to search for hotels by check-in date, check-out date, 
// and city. I also want to filter them by name, star-rating, and price range.
// Search results should display in a list that shows the hotel information, 
// starting price, and a location pinpoint on a map. The results should only 
// reflect available rooms.
//
// GET {{base_url}}/hotels
// ?checkinDate=2025-04-15&checkoutDate=2025-04-20&city=Toronto&name=bbbbbbbb Sunshine&star=5&lowerpriceRange=100&upperpriceRange=300

// As a user, I want to add my hotel to the platform. A hotel has name, logo, 
// address, location, star-rating, and several images
//
// POST {{base_url}}/hotels

import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { withAuth } from "@/utils/auth"; 
import { isJsonString } from "@/utils/isJson"; 

async function POST_create(request) {
    if (request.method !== "POST") {
        return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
    }
    const {name, logo, address, city, starRating, images} = await request.json();
    const ownerId = request.user.id;
    if (typeof(name) !== "string" || !name){
        return NextResponse.json({message: "Invalid name"}, {status: 400});
    }
    if (typeof(logo) !== "string" || !logo){
        return NextResponse.json({message:"Invalid logo"}, {status: 400});
    }
    if (typeof(address) !== "string" || !address){
        return NextResponse.json({message:"Invalid address"}, {status: 400});
    }
    if (typeof(city) !== "string" || !city){
        return NextResponse.json({message:"Invalid city"}, {status: 400});
    }
    if (typeof(starRating) !== "number" || !starRating){
        return NextResponse.json({message:"Invalid starRating"}, {status: 400});
    }

    if (starRating <= 0){
        return NextResponse.json({message:"star rating must be in the range of 1 - 5"}, {status: 400});
    }

    // if (typeof images !== "string" || !images) {
    if (isJsonString(images) === false || !images) {
        return NextResponse.json({ message: "Invalid images"}, { status: 400 });
    }

    const existingCity = await prisma.City.findUnique({
        where: { city }
    });

    if (!existingCity) {
        return NextResponse.json({ message: "City not found" }, { status: 400 });
    }

    const hotel = await prisma.Hotel.create({
        data:{
            name,
            logo,
            address,
            city,
            starRating,
            images,
            ownerId
        },
    });
    return NextResponse.json({ message: "Hotel added successfully", hotel }, { status: 201 });

}

export async function GET(request) {
    if (request.method !== "GET") {
        return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
    }
    try {
        // Extract query parameters
        const searchParams = new URL(request.url).searchParams;
        const checkinDate = searchParams.get("checkinDate");
        const checkoutDate = searchParams.get("checkoutDate");
        const city = searchParams.get("city");
        const star = searchParams.get("star");
        const hotelName = searchParams.get("name");
        const lowerpriceRange = parseFloat(searchParams.get("lowerpriceRange")) || 0;
        const upperpriceRange = parseFloat(searchParams.get("upperpriceRange")) || Infinity;

        // Build the where clause
        const whereClause = {
            hotel: {
                ...(hotelName && { name: hotelName }),
                ...(city && { city: city }),
                ...(star && { starRating: Number(star) })
            },
            pricePerNight: { 
                gte: lowerpriceRange, 
                lte: upperpriceRange 
            }
        };

        // Only add booking conditions if both dates are provided
        if (checkinDate && checkoutDate) {
            whereClause.bookings = {
                none: {
                    checkIn: { lt: new Date(checkoutDate) },
                    checkOut: { gt: new Date(checkinDate) }
                }
            };
        }

        // Find rooms that are NOT booked during the given dates
        const availableRooms = await prisma.Room.findMany({
            where: whereClause,
            include: {
                hotel: true
            },
            orderBy: {
                pricePerNight: 'asc'
            }
        });

        return NextResponse.json(availableRooms);
    } catch (error) {
        console.error("Error fetching available rooms:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// This immediately returns an error response (such as 401 Unauthorized or 403 Forbidden) without calling your handler.
export const POST = withAuth(POST_create);
