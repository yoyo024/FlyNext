import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { withAuth } from "@/utils/auth";

async function GET_owned_hotels(request) {
  if (request.method !== "GET") {
    return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
  }

  try {
    // Get the current user's ID from the authenticated request
    const userId = request.user.id;

    // Fetch all hotels owned by the current user
    const hotels = await prisma.Hotel.findMany({
      where: {
        ownerId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(hotels);
  } catch (error) {
    console.error("Error fetching owned hotels:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Wrap with authentication middleware
export const GET = withAuth(GET_owned_hotels); 