// As a visitor, I want to view the availability and details of different room types for 
// my selected dates in a selected hotel.
//
// As a hotel owner, I want to view room availability (per room type) for specific 
// date ranges to better understand occupancy trends..
//
// GET {{base_url}}/hotels/:hotel_id/rooms
// owner -> optional: date range -> availability/total
// visiter -> date range -> availability, details

// As a hotel owner, I want to define room types, with each type having a name 
// (e.g., twin, double, etc.), amenities, prices per night, and several images.
//
// POST {{base_url}}/hotels/:hotel_id/rooms

import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { withAuth } from "@/utils/auth"; 
import { isJsonString } from "@/utils/isJson"; 

async function GET_empty_room_date(request, {params}) {
    if (request.method !== "GET") {
        return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
    }

    const {hotel_id} = await params;
    const hotel_id_int = parseInt(hotel_id);

  if (isNaN(hotel_id_int)) {
    return NextResponse.json({ message: 'Invalid hotel ID' }, { status: 400 });
  }

  try {
    // Check if hotel exists
    const hotel = await prisma.Hotel.findFirst({
      where: { id: hotel_id_int },
    });

    if (!hotel) {
      return NextResponse.json({ message: 'Hotel not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');

    const isOwner = request.user?.id === hotel.ownerId;

    let formattedStartDate = dateStart ? new Date(dateStart) : null;
    let formattedEndDate = dateEnd ? new Date(dateEnd) : null;

    if (formattedStartDate && isNaN(formattedStartDate)) {
      return NextResponse.json({ message: "Invalid start date format" }, { status: 400 });
    }
    if (formattedEndDate && isNaN(formattedEndDate)) {
      return NextResponse.json({ message: "Invalid end date format" }, { status: 400 });
    }

    const rooms = await prisma.Room.findMany({
      where: { hotelId: hotel_id_int },
      select: {
        id: true,
        type: true,
        bookings: formattedStartDate && formattedEndDate ? {
          where: {
            checkIn: { lte: formattedEndDate },
            checkOut: { gte: formattedStartDate },
          },
        } : false,
        amenities: true, 
        pricePerNight: true, 
        images: true
      },
    });

    if (isOwner) {
      // Group by room type
      const roomTypes = {};
      rooms.forEach(room => {
        if (!roomTypes[room.type]) {
          roomTypes[room.type] = { totalRooms: 0, availableRooms: 0 };
        }
        roomTypes[room.type].totalRooms++;
        if (!room.bookings || room.bookings.length === 0) {
          roomTypes[room.type].availableRooms++;
        }
      });

      return NextResponse.json(Object.entries(roomTypes).map(([roomType, data]) => ({
        roomType,
        totalRooms: data.totalRooms,
        availableRooms: data.availableRooms,
      })));

    } else {

      // Visitors: return available rooms, room details

      const roomTypeMap = new Map();

      rooms.forEach(room => {
        if (!roomTypeMap.has(room.type)) {
          roomTypeMap.set(room.type, {
            roomType: room.type,
            availableRooms: 0,
            pricePerNight: room.pricePerNight,
            amenities: room.amenities,
            images: room.images
          });
        }
        roomTypeMap.get(room.type).availableRooms++;
      });

      const availability = Array.from(roomTypeMap.values());
      return NextResponse.json(availability);
    }
  } catch (error) {
    console.error('Error fetching room availability:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

async function POST_room(request, {params} ) {
  // Only allow POST method
  if (request.method !== "POST") {
    return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
  }

  // Get hotel_id from URL path
  const { hotel_id } = await params;

  // Ensure hotel_id is an integer
  const hotel_id_int = parseInt(hotel_id);
  if (isNaN(hotel_id_int)) {
    return NextResponse.json({ message: "Invalid hotel ID" }, { status: 400 });
  }

  try {
    // Check if hotel exists
    const hotel = await prisma.Hotel.findFirst({
      where: { id: hotel_id_int },
    });

    if (!hotel) {
      return NextResponse.json({ message: "Hotel not found" }, { status: 404 });
    }

    // Check if the authenticated user owns the hotel
    if (hotel.ownerId !== request.user.id) {
      return NextResponse.json({ message: "Unauthorized: You do not own this hotel." }, { status: 403 });
    }

    // Parse the request body
    const { type, amenities, pricePerNight, images } = await request.json();

    // Validate the input fields
    if (typeof(type) !== "string" || !type) {
      return NextResponse.json({ message: "Invalid room type" }, { status: 400 });
    }

    if (isJsonString(amenities) === false || !amenities) {
      return NextResponse.json({ message: "Invalid amenities" }, { status: 400 });
    }

    if (typeof(pricePerNight) !== "number" || !pricePerNight) {
      return NextResponse.json({ message: "Invalid price per night" }, { status: 400 });
    }

    if (pricePerNight <= 0){
      return NextResponse.json({ message: "Price must be greater than 0" }, { status: 400 });
    }

    if (isJsonString(images) === false || !images) {
      return NextResponse.json({ message: "Invalid images"}, { status: 400 });
    }

    // Create the new room
    const room = await prisma.Room.create({
      data: {
        type,
        amenities,
        pricePerNight,
        images,
        hotelId: hotel_id_int, // Ensure hotel_id is an integer
      },
    });

    // Return success response
    return NextResponse.json({ message: "Room added successfully", room }, { status: 201 });

  } catch (error) {
    console.error("Error occurred while fetching hotel or creating room:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Wrap handler with authentication middleware
export const POST = withAuth(POST_room);
export const GET = withAuth(GET_empty_room_date);

